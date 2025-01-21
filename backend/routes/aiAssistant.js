const express = require('express');
const router = express.Router();
const { generateResponse } = require('../services/openaiService');
const { createQuote } = require('../services/quoteService');

router.post('/ai-assistant', async (req, res) => {
  try {
    const { userMessage, conversationHistory = [] } = req.body;

    // Generate response using OpenAI
    const response = await generateResponse(userMessage, conversationHistory);

    if (!response.success) {
      return res.status(500).json({ 
        error: 'Failed to generate response',
        details: response.error
      });
    }

    res.json({ reply: response.reply });

  } catch (error) {
    console.error('AI Assistant Error:', error);
    res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message
    });
  }
});

module.exports = router; 