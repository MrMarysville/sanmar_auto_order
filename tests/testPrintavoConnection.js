require('dotenv').config();
const { verifyConnection, findContactByEmail, getAccount } = require('../services/printavoService');

async function testConnection() {
  console.log('Testing Printavo API connection...');
  
  try {
    // Test 1: Verify basic connection
    console.log('\n1. Testing API connection...');
    const isConnected = await verifyConnection();
    console.log('✓ Connection successful');

    // Test 2: Get account info
    console.log('\n2. Fetching account information...');
    const account = await getAccount();
    console.log('✓ Account info retrieved:', {
      id: account.id,
      name: account.name
    });

    // Test 3: Search for a contact
    console.log('\n3. Testing contact search...');
    const testEmail = process.env.PRINTAVO_EMAIL;
    const contact = await findContactByEmail(testEmail);
    if (contact) {
      console.log('✓ Contact found:', {
        id: contact.id,
        fullName: contact.fullName,
        email: contact.email
      });
    } else {
      console.log('✓ No contact found with email:', testEmail);
    }

    console.log('\nAll tests completed successfully! ✨');
  } catch (error) {
    console.error('\n❌ Test failed:', {
      name: error.name,
      message: error.message,
      code: error.code,
      details: error.details
    });
    process.exit(1);
  }
}

testConnection(); 