const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// System message to define the AI assistant's behavior
const SYSTEM_MESSAGE = {
  role: 'system',
  content: `You are a helpful AI assistant for a print shop using Printavo. You can help with:
1. Creating quotes and orders in Printavo
2. Processing and extracting information from invoices
3. Answering questions about orders and products
4. Providing information about SanMar products and inventory

Keep your responses concise and focused on helping the user with their print shop tasks.
When creating quotes, make sure to ask for all necessary information like customer email, product details, quantities, and sizes.`
};

async function generateResponse(userMessage, conversationHistory = []) {
  try {
    const messages = [
      SYSTEM_MESSAGE,
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 500
    });

    return {
      reply: completion.choices[0].message.content,
      success: true
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return {
      reply: 'I apologize, but I encountered an error. Please try again.',
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  generateResponse
}; 