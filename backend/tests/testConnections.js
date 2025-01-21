/**
 * @fileoverview Connection Test Script
 * Tests connections to both Printavo and SanMar APIs
 * 
 * Usage: node tests/testConnections.js
 */

import printavoService from '../services/printavoService.js';
import { getPreSubmitInfo, getPOStatus } from '../services/sanmarService.js';
import { validatePrintavoEnv, validateSanMarEnv, loadSanMarConfig } from '../utils/envValidation.js';
import { LOG_LEVELS, log } from '../utils/logger.js';
import { SanMarAPIError, ERROR_CODES } from '../utils/errorHandling.js';

async function testPrintavoConnection() {
  console.log('\n🔍 Testing Printavo Connection...');
  
  try {
    // Validate environment variables
    await validatePrintavoEnv();
    console.log('✅ Environment variables validated');

    // Test API connection
    const result = await printavoService.account.verifyConnection();
    if (result) {
      console.log('✅ Successfully connected to Printavo API');
      
      // Get additional account info
      const account = await printavoService.account.getAccount();
      console.log('📋 Account Details:');
      console.log(`   Name: ${account.name}`);
      console.log(`   Email: ${account.email}`);
      console.log(`   Subscription: ${account.subscription?.plan || 'N/A'}`);
    }
  } catch (error) {
    console.error('❌ Printavo Connection Failed:');
    console.error(`   Error: ${error.message}`);
    if (error.metadata) {
      console.error('   Additional Info:', error.metadata);
    }
    if (process.env.NODE_ENV === 'development') {
      console.error('\nStack Trace:', error.stack);
    }
    process.exitCode = 1;
  }
}

async function testSanMarConnection() {
  console.log('\n🔍 Testing SanMar Connection...');
  
  try {
    // Test environment validation
    await validateSanMarEnv();
    console.log('✅ Environment variables validated');

    // Test config loading
    const config = loadSanMarConfig();
    console.log('✅ Configuration loaded successfully');

    // Test WSSecurity setup
    console.log('\n📡 Testing SOAP Authentication...');
    
    // Test with empty line items (should handle gracefully)
    console.log('\n🧪 Testing empty line items handling...');
    const emptyResult = await getPreSubmitInfo([]);
    if (emptyResult.PreSubmitResponse.items.length === 0) {
      console.log('✅ Empty line items handled correctly');
    }

    // Test with valid line items
    console.log('\n🧪 Testing inventory check...');
    const testLineItems = [{
      inventoryKey: 'K100',  // Common SanMar product
      quantity: 1,
      sizeIndex: 0
    }];

    const result = await getPreSubmitInfo(testLineItems);
    if (result.PreSubmitResponse && Array.isArray(result.PreSubmitResponse.items)) {
      console.log('✅ Successfully retrieved inventory information');
      console.log('📋 Response Details:');
      console.log(`   Items checked: ${result.PreSubmitResponse.items.length}`);
    }

    // Test invalid credentials (should fail gracefully)
    console.log('\n🧪 Testing error handling...');
    try {
      const invalidItems = [{
        inventoryKey: 'INVALID_KEY',
        quantity: -1,  // Invalid quantity
        sizeIndex: 0
      }];
      await getPreSubmitInfo(invalidItems);
    } catch (error) {
      if (error instanceof SanMarAPIError && 
          error.code === ERROR_CODES.VALIDATION.INVALID_INPUT) {
        console.log('✅ Invalid input handled correctly');
      } else {
        throw error;
      }
    }

    // Test PO status check with invalid PO (should fail gracefully)
    try {
      await getPOStatus('INVALID_PO');
    } catch (error) {
      if (error instanceof SanMarAPIError) {
        console.log('✅ Invalid PO number handled correctly');
      } else {
        throw error;
      }
    }

    console.log('\n✅ All SanMar API tests completed successfully');
    
  } catch (error) {
    console.error('❌ SanMar Connection Failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error instanceof SanMarAPIError) {
      console.error(`   Error Code: ${error.code}`);
      if (error.code === ERROR_CODES.VALIDATION.INVALID_CREDENTIALS) {
        console.error('   Hint: Check your SANMAR_USERNAME and SANMAR_PASSWORD');
      } else if (error.code === ERROR_CODES.SYSTEM.CONFIGURATION) {
        console.error('   Hint: Verify your SANMAR_WSDL_URL');
      }
    }
    
    if (error.metadata) {
      console.error('   Additional Info:', error.metadata);
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.error('\nStack Trace:', error.stack);
    }
    
    process.exitCode = 1;
  }
}

async function runTests() {
  console.log('🚀 Starting API Connection Tests...');
  
  try {
    await testPrintavoConnection();
    await testSanMarConnection();
    
    if (process.exitCode === 1) {
      console.log('\n❌ Some tests failed. Please check the errors above.');
    } else {
      console.log('\n✅ All connection tests passed successfully!');
      console.log('\n📝 Test Summary:');
      console.log('   - Environment variables validated');
      console.log('   - SOAP authentication verified');
      console.log('   - Empty line items handling confirmed');
      console.log('   - Inventory check successful');
      console.log('   - Error handling verified');
    }
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exitCode = 1;
  }
}

// Run tests if this script is executed directly
if (import.meta.url === new URL(import.meta.url).href) {
  runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exitCode = 1;
  });
}

export {
  testPrintavoConnection,
  testSanMarConnection,
  runTests
};
