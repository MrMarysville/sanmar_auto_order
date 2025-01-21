const { LOG_LEVELS, log } = require('../utils/logger');
const { PrintavoValidationError } = require('../utils/errorHandling');
const vision = require('@google-cloud/vision');
const { parseLineItems } = require('./lineItemService');

// Initialize Google Cloud Vision client
const client = new vision.ImageAnnotatorClient();

/**
 * Process an invoice image using OCR and extract line items
 * @param {string} base64Image Base64 encoded image data
 * @returns {Promise<Object>} Extracted invoice data including line items
 */
async function processInvoice(base64Image) {
  log(LOG_LEVELS.INFO, 'Processing invoice image with OCR');
  
  try {
    // Validate input
    if (!base64Image) {
      throw new PrintavoValidationError(
        'No image data provided',
        { details: 'base64Image parameter is required' }
      );
    }
    
    // Remove data URL prefix if present
    const imageData = base64Image.replace(/^data:image\/\w+;base64,/, '');
    
    // Perform OCR using Google Cloud Vision
    const [result] = await client.textDetection({
      image: { content: imageData }
    });
    
    const detections = result.textAnnotations;
    if (!detections || detections.length === 0) {
      throw new PrintavoValidationError(
        'No text detected in image',
        { details: 'The image may be blank or unreadable' }
      );
    }
    
    // Extract full text from OCR result
    const extractedText = detections[0].description;
    log(LOG_LEVELS.DEBUG, 'Extracted text from image', {
      textLength: extractedText.length,
      firstLine: extractedText.split('\n')[0]
    });
    
    // Parse line items from extracted text
    const lineItems = await parseLineItems(extractedText);
    
    // Extract invoice metadata (PO number, date, etc)
    const metadata = extractInvoiceMetadata(extractedText);
    
    return {
      success: true,
      lineItems,
      metadata,
      rawText: extractedText
    };
    
  } catch (error) {
    if (error instanceof PrintavoValidationError) {
      throw error;
    }
    throw new PrintavoValidationError(
      'Failed to process invoice image',
      { originalError: error.message }
    );
  }
}

/**
 * Extract invoice metadata from OCR text
 * @param {string} text OCR extracted text
 * @returns {Object} Extracted metadata
 */
function extractInvoiceMetadata(text) {
  const metadata = {
    poNumber: null,
    orderDate: null,
    invoiceNumber: null,
    total: null
  };
  
  // Split into lines and clean
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
    
  for (const line of lines) {
    // Look for PO number
    const poMatch = line.match(/p\.?o\.?\s*#?\s*:?\s*(\w+[-\d]+)/i);
    if (poMatch && !metadata.poNumber) {
      metadata.poNumber = poMatch[1];
      continue;
    }
    
    // Look for order date
    const dateMatch = line.match(/date:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i);
    if (dateMatch && !metadata.orderDate) {
      metadata.orderDate = dateMatch[1];
      continue;
    }
    
    // Look for invoice number
    const invoiceMatch = line.match(/inv(oice)?\.?\s*#?\s*:?\s*(\w+[-\d]+)/i);
    if (invoiceMatch && !metadata.invoiceNumber) {
      metadata.invoiceNumber = invoiceMatch[2];
      continue;
    }
    
    // Look for total amount
    const totalMatch = line.match(/total:?\s*\$?\s*([\d,.]+)/i);
    if (totalMatch && !metadata.total) {
      metadata.total = parseFloat(totalMatch[1].replace(/,/g, ''));
      continue;
    }
  }
  
  return metadata;
}

module.exports = { processInvoice }; 