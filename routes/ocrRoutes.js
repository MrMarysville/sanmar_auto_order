const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const fs = require('fs').promises;
const path = require('path');
const pdf2img = require('pdf2img');
const InventoryMapping = require('../models/InventoryMapping');

const router = express.Router();

// Constants for validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_FILE_SIZE = 1024; // 1KB
const MAX_PDF_PAGES = 10;
const MIN_OCR_CONFIDENCE = 60;
const MAX_LINE_ITEMS = 100;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      // Ensure uploads directory exists and is writable
      const uploadsDir = 'uploads';
      try {
        await fs.access(uploadsDir, fs.constants.W_OK);
      } catch {
        await fs.mkdir(uploadsDir, { recursive: true, mode: 0o755 });
      }
      
      // Verify directory is writable
      const testFile = path.join(uploadsDir, '.write-test');
      await fs.writeFile(testFile, '');
      await fs.unlink(testFile);
      
      cb(null, uploadsDir);
    } catch (error) {
      cb(new Error(`Upload directory error: ${error.message}`));
    }
  },
  filename: function (req, file, cb) {
    try {
      const fileExt = path.extname(file.originalname).toLowerCase();
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const sanitizedName = file.fieldname + '-' + uniqueSuffix + fileExt;
      
      // Validate filename
      if (!/^[a-zA-Z0-9-_.]+$/.test(sanitizedName)) {
        throw new Error('Invalid characters in filename');
      }
      
      cb(null, sanitizedName);
    } catch (error) {
      cb(new Error(`Filename error: ${error.message}`));
    }
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    try {
      // Check file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new Error('Invalid file type. Only PNG, JPEG, and PDF are allowed.');
      }

      // Check file extension
      const ext = path.extname(file.originalname).toLowerCase();
      const allowedExts = ['.png', '.jpg', '.jpeg', '.pdf'];
      if (!allowedExts.includes(ext)) {
        throw new Error('Invalid file extension');
      }

      // Check original filename length
      if (file.originalname.length > 255) {
        throw new Error('Filename too long');
      }

      cb(null, true);
    } catch (error) {
      cb(error);
    }
  }
}).single('invoiceFile');

// Wrapper for multer upload to handle errors
const uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        error: 'File upload error',
        details: err.message,
        code: 'UPLOAD_ERROR'
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        error: err.message,
        code: 'VALIDATION_ERROR'
      });
    }
    next();
  });
};

// Helper function to convert PDF to images with enhanced error handling and multi-page support
async function convertPDFToImages(pdfPath) {
  return new Promise((resolve, reject) => {
    const options = {
      type: 'jpg',
      size: 2048,
      density: 200,
      quality: 100,
      outputdir: path.dirname(pdfPath),
      outputname: path.basename(pdfPath, '.pdf')
    };

    pdf2img.convert(pdfPath, options, (err, images) => {
      if (err) {
        if (err.message.includes('ghostscript')) {
          reject(new Error('PDF conversion failed: Ghostscript not installed or not in PATH'));
        } else if (err.message.includes('damaged')) {
          reject(new Error('PDF conversion failed: File appears to be damaged or corrupted'));
        } else {
          reject(new Error(`PDF conversion failed: ${err.message}`));
        }
        return;
      }

      if (!images || images.length === 0) {
        reject(new Error('No images were generated from the PDF'));
        return;
      }

      if (images.length > MAX_PDF_PAGES) {
        reject(new Error(`PDF has too many pages. Maximum allowed is ${MAX_PDF_PAGES}`));
        return;
      }

      // Return all image paths
      resolve(images);
    });
  });
}

// Helper function to perform OCR on a single image
async function performOCR(imagePath) {
  return Promise.race([
    Tesseract.recognize(
      imagePath,
      'eng',
      { 
        logger: m => console.log(`OCR Progress (${path.basename(imagePath)}):`, m),
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ',
        tessedit_pageseg_mode: '1'  // Automatic page segmentation with OSD
      }
    ),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`OCR timeout for ${path.basename(imagePath)}`)), 30000)
    )
  ]);
}

// Helper function to combine OCR results from multiple pages
function combineOCRResults(results) {
  return {
    data: {
      text: results.map(r => r.data.text).join('\n\n'),
      confidence: results.reduce((acc, r) => acc + r.data.confidence, 0) / results.length
    }
  };
}

// Helper function to validate PDF with enhanced checks
async function validatePDF(filePath) {
  try {
    // Check file existence
    const stats = await fs.stat(filePath);
    
    // Size checks
    if (stats.size === 0) {
      throw new Error('PDF file is empty');
    }
    if (stats.size < MIN_FILE_SIZE) {
      throw new Error('PDF file is too small');
    }
    if (stats.size > MAX_FILE_SIZE) {
      throw new Error('PDF file exceeds maximum size limit');
    }

    // Check file permissions
    try {
      await fs.access(filePath, fs.constants.R_OK);
    } catch {
      throw new Error('PDF file is not readable');
    }

    // Verify PDF header
    const buffer = Buffer.alloc(5);
    const fileHandle = await fs.open(filePath, 'r');
    try {
      const { bytesRead } = await fileHandle.read(buffer, 0, 5, 0);
      if (bytesRead !== 5) {
        throw new Error('Could not read PDF header');
      }
    } finally {
      await fileHandle.close();
    }

    if (buffer.toString() !== '%PDF-') {
      throw new Error('Invalid PDF file format');
    }

    return true;
  } catch (error) {
    throw new Error(`PDF validation failed: ${error.message}`);
  }
}

// Helper function to parse line items with enhanced validation
async function parseLineItems(text) {
  if (typeof text !== 'string') {
    throw new Error('Invalid OCR text format');
  }

  const lines = text.split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .slice(0, MAX_LINE_ITEMS); // Limit number of lines to prevent abuse

  const lineItems = [];
  const errors = [];

  for (const line of lines) {
    try {
      // Match pattern: style code, color, size, quantity
      const match = line.match(/(?<style>\w+)\s+(?<color>\w+)\s+(?<size>[A-Z0-9XL]+)\s+(?<quantity>\d+)/i);
      
      if (match?.groups) {
        const { style, color, size, quantity } = match.groups;

        // Validate individual fields
        if (style.length > 20 || color.length > 20 || size.length > 10) {
          throw new Error('Field length exceeds maximum');
        }

        const qty = parseInt(quantity, 10);
        if (isNaN(qty) || qty <= 0 || qty > 10000) {
          throw new Error('Invalid quantity');
        }

        try {
          const mapping = await InventoryMapping.findOne({
            printavoStyleCode: style.toUpperCase(),
            color: new RegExp(`^${color}$`, 'i'),
            size: size.toUpperCase()
          });

          if (mapping) {
            lineItems.push({
              originalText: line,
              inventoryKey: mapping.sanmarInventoryKey,
              sizeIndex: mapping.sizeIndex,
              warehouse: mapping.warehouse,
              quantity: qty,
              confidence: 'high'
            });
          } else {
            errors.push({
              originalText: line,
              error: 'No mapping found',
              unmappedData: { style, color, size, quantity },
              type: 'MAPPING_ERROR'
            });
          }
        } catch (error) {
          errors.push({
            originalText: line,
            error: `Database error: ${error.message}`,
            unmappedData: { style, color, size, quantity },
            type: 'DB_ERROR'
          });
        }
      } else {
        errors.push({
          originalText: line,
          error: 'Line format does not match expected pattern',
          type: 'FORMAT_ERROR'
        });
      }
    } catch (error) {
      errors.push({
        originalText: line,
        error: error.message,
        type: 'PARSING_ERROR'
      });
    }
  }

  if (lineItems.length === 0 && errors.length === 0) {
    throw new Error('No valid line items found in the text');
  }

  return { lineItems, errors };
}

// Helper function to clean up files with enhanced error handling
async function cleanupFiles(files) {
  const cleanupErrors = [];
  
  for (const file of files) {
    try {
      if (!file) continue;
      
      // Check if file exists and is accessible
      const exists = await fs.access(file)
        .then(() => true)
        .catch(() => false);
      
      if (exists) {
        // Verify it's a file and not a directory
        const stats = await fs.stat(file);
        if (!stats.isFile()) {
          cleanupErrors.push(`${file} is not a file`);
          continue;
        }

        // Check write permissions (needed for deletion)
        await fs.access(file, fs.constants.W_OK);
        
        // Delete the file
        await fs.unlink(file);
      }
    } catch (error) {
      cleanupErrors.push(`Error deleting ${file}: ${error.message}`);
    }
  }

  if (cleanupErrors.length > 0) {
    console.error('Cleanup errors:', cleanupErrors);
  }

  return cleanupErrors;
}

// Upload and process invoice route
router.post('/upload-invoice', uploadMiddleware, async (req, res) => {
  const filesToCleanup = [];
  const processingErrors = [];
  const pageResults = [];
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded',
        code: 'NO_FILE'
      });
    }

    // Track file for cleanup
    filesToCleanup.push(req.file.path);
    let imagesToProcess = [req.file.path];

    // Process PDF if necessary
    if (req.file.mimetype === 'application/pdf') {
      try {
        console.log('Validating PDF...');
        await validatePDF(req.file.path);

        console.log('Converting PDF to images...');
        imagesToProcess = await convertPDFToImages(req.file.path);
        filesToCleanup.push(...imagesToProcess);
        
        console.log(`PDF converted to ${imagesToProcess.length} images`);
      } catch (pdfError) {
        const cleanupErrors = await cleanupFiles(filesToCleanup);
        return res.status(400).json({
          success: false,
          error: pdfError.message,
          code: 'PDF_ERROR',
          cleanupErrors: cleanupErrors.length > 0 ? cleanupErrors : undefined
        });
      }
    }

    // Process each image
    for (let i = 0; i < imagesToProcess.length; i++) {
      const imagePath = imagesToProcess[i];
      const pageNumber = i + 1;

      try {
        // Verify image before OCR
        await fs.access(imagePath, fs.constants.R_OK);
        const stats = await fs.stat(imagePath);
        if (!stats.isFile() || stats.size === 0) {
          throw new Error(`Invalid image file for page ${pageNumber}`);
        }

        // Perform OCR
        console.log(`Processing page ${pageNumber}:`, imagePath);
        const pageResult = await performOCR(imagePath);

        // Validate page results
        if (!pageResult.data.text || pageResult.data.text.trim().length === 0) {
          processingErrors.push({
            type: 'EMPTY_PAGE',
            message: `No text extracted from page ${pageNumber}`,
            pageNumber
          });
          continue;
        }

        if (pageResult.data.confidence < MIN_OCR_CONFIDENCE) {
          processingErrors.push({
            type: 'LOW_CONFIDENCE',
            message: `OCR confidence (${pageResult.data.confidence}) below threshold for page ${pageNumber}`,
            pageNumber,
            confidence: pageResult.data.confidence
          });
        }

        pageResults.push({
          pageNumber,
          result: pageResult
        });

      } catch (pageError) {
        processingErrors.push({
          type: 'PAGE_PROCESSING_ERROR',
          message: pageError.message,
          pageNumber
        });
      }
    }

    if (pageResults.length === 0) {
      throw new Error('No pages were successfully processed');
    }

    // Combine results from all pages
    const ocrResult = combineOCRResults(pageResults.map(p => p.result));

    // Parse combined text
    const { lineItems, errors } = await parseLineItems(ocrResult.data.text);

    // Clean up files
    const cleanupErrors = await cleanupFiles(filesToCleanup);
    if (cleanupErrors.length > 0) {
      processingErrors.push({
        type: 'CLEANUP_ERROR',
        errors: cleanupErrors
      });
    }

    // Return results with warnings if any
    res.json({
      success: true,
      lineItems,
      parsingErrors: errors,
      processingErrors: processingErrors.length > 0 ? processingErrors : undefined,
      stats: {
        totalItems: lineItems.length,
        errorCount: errors.length,
        confidence: ocrResult.data.confidence,
        processingTime: Date.now() - req.startTime,
        totalPages: pageResults.length,
        processedPages: pageResults.map(p => p.pageNumber)
      },
      pageDetails: pageResults.map(p => ({
        pageNumber: p.pageNumber,
        confidence: p.result.data.confidence,
        textLength: p.result.data.text.length
      })),
      rawText: ocrResult.data.text
    });

  } catch (error) {
    console.error('Processing Error:', error);
    
    // Attempt cleanup
    const cleanupErrors = await cleanupFiles(filesToCleanup);
    
    // Determine error type and code
    let errorCode = 'UNKNOWN_ERROR';
    if (error.message.includes('OCR')) errorCode = 'OCR_ERROR';
    else if (error.message.includes('timeout')) errorCode = 'TIMEOUT_ERROR';
    else if (error.message.includes('validation')) errorCode = 'VALIDATION_ERROR';

    res.status(500).json({
      success: false,
      error: error.message,
      code: errorCode,
      details: error.stack,
      cleanupErrors: cleanupErrors.length > 0 ? cleanupErrors : undefined,
      processingErrors
    });
  }
});

module.exports = router; 