import express from 'express';
import { getPreSubmitInfo, submitPO } from '../services/sanmarService.js';

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Test getPreSubmitInfo endpoint
router.get('/test-get-presubmit', async (req, res) => {
  try {
    // Example test items
    const testLineItems = [
      {
        inventoryKey: 'PC61BLK',
        quantity: 12,
        sizeIndex: 'L',
        warehouse: 'ATL'
      }
    ];
    const response = await getPreSubmitInfo(testLineItems);
    res.json({ success: true, response });
  } catch (error) {
    console.error('PreSubmit Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test submitPO endpoint
router.post('/test-submit-po', async (req, res) => {
  try {
    const { poNumber, shipToName, lineItems, ...shippingDetails } = req.body;

    if (!poNumber || !shipToName || !lineItems) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: poNumber, shipToName, or lineItems'
      });
    }

    const response = await submitPO({
      poNumber,
      shipToName,
      ...shippingDetails,
      lineItems
    });

    res.json({ success: true, response });
  } catch (error) {
    console.error('Submit PO Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router; 