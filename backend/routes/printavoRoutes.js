const express = require('express');
const router = express.Router();
const printavoService = require('../services/printavoService');

// Get a specific invoice
router.get('/invoices/:id', async (req, res) => {
  try {
    const invoice = await printavoService.getInvoice(req.params.id);
    res.json({
      success: true,
      invoice
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get recent invoices with pagination
router.get('/invoices', async (req, res) => {
  try {
    const { first = 10, after } = req.query;
    const invoices = await printavoService.getRecentInvoices(
      parseInt(first, 10),
      after
    );
    res.json({
      success: true,
      ...invoices
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new invoice
router.post('/invoices', async (req, res) => {
  try {
    const invoice = await printavoService.createInvoice(req.body);
    res.json({
      success: true,
      invoice
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Search invoices
router.post('/invoices/search', async (req, res) => {
  try {
    const { statusIds, dateRange, first } = req.body;
    const invoices = await printavoService.searchInvoices({
      statusIds,
      dateRange,
      first
    });
    res.json({
      success: true,
      invoices
    });
  } catch (error) {
    console.error('Error searching invoices:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create invoice from OCR results
router.post('/invoices/from-ocr', async (req, res) => {
  try {
    const { contactId, lineItems, shippingAddress } = req.body;
    
    // Validate required fields
    if (!contactId || !lineItems || !shippingAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: contactId, lineItems, or shippingAddress'
      });
    }

    // Format line items for Printavo
    const formattedLineItems = lineItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      size: item.size,
      color: item.color
    }));

    // Create invoice in Printavo
    const invoice = await printavoService.createInvoice({
      contactId,
      lineItems: formattedLineItems,
      shippingAddress,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    });

    res.json({
      success: true,
      invoice
    });
  } catch (error) {
    console.error('Error creating invoice from OCR:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get account information
router.get('/account', async (req, res) => {
  try {
    const account = await printavoService.getAccount();
    res.json({
      success: true,
      account
    });
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
