const express = require('express');
const router = express.Router();
const multer = require('multer');
const { processInvoice } = require('../services/ocrService');
const { parseLineItems } = require('../services/lineItemService');
const { createQuote } = require('../services/quoteService');

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and images are allowed.'));
    }
  }
});

router.post('/parse-document', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Process the document with OCR
    const extractedText = await processInvoice(req.file.buffer);
    
    // Parse line items from the extracted text
    const lineItems = await parseLineItems(extractedText);

    // Extract potential contact information using regex
    const emailMatch = extractedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = extractedText.match(/(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
    
    // Create quote preview
    const quotePreview = {
      contact: {
        email: emailMatch ? emailMatch[0] : null,
        phone: phoneMatch ? phoneMatch[0] : null
      },
      lineItems,
      customerNote: "Generated from uploaded document"
    };

    res.json({ 
      quote: quotePreview,
      rawText: extractedText // Include for debugging
    });

  } catch (error) {
    console.error('Document parsing error:', error);
    res.status(500).json({ 
      error: 'Failed to process document',
      details: error.message
    });
  }
});

router.post('/quotes', async (req, res) => {
  try {
    const quoteData = req.body;
    const quote = await createQuote(quoteData);
    res.json(quote);
  } catch (error) {
    console.error('Quote creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create quote',
      details: error.message
    });
  }
});

module.exports = router; 