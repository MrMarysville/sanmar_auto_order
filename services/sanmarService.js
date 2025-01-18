require('dotenv').config();
const { soap } = require('strong-soap');

const wsdlUrl = process.env.SANMAR_WSDL_URL;
const username = process.env.SANMAR_USERNAME;
const password = process.env.SANMAR_PASSWORD;

/**
 * Creates a SOAP client with authentication
 * @returns {Promise} SOAP client instance
 */
async function createSoapClient() {
  return new Promise((resolve, reject) => {
    soap.createClient(wsdlUrl, (err, client) => {
      if (err) return reject(err);
      client.setSecurity(new soap.WSSecurity(username, password));
      resolve(client);
    });
  });
}

/**
 * Check inventory availability via SanMar's SOAP API
 * @param {Array} lineItems Example: [{ inventoryKey, quantity, sizeIndex, warehouse }]
 * @returns {Promise} PreSubmit information response
 */
async function getPreSubmitInfo(lineItems = []) {
  try {
    const client = await createSoapClient();
    
    const request = {
      PreSubmitRequest: {
        items: lineItems.map(item => ({
          inventoryKey: item.inventoryKey,
          quantity: item.quantity,
          sizeIndex: item.sizeIndex,
          warehouse: item.warehouse
        }))
      }
    };

    return new Promise((resolve, reject) => {
      client.getPreSubmitInfo(request, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  } catch (error) {
    throw new Error(`PreSubmit Error: ${error.message}`);
  }
}

/**
 * Submit purchase order to SanMar
 * @param {Object} orderData Order details including poNumber, shipToName, and lineItems
 * @returns {Promise} Order submission response
 */
async function submitPO(orderData) {
  try {
    const client = await createSoapClient();
    
    const request = {
      PORequest: {
        header: {
          poNumber: orderData.poNumber,
          shipToName: orderData.shipToName,
          shipToAddress1: orderData.shipToAddress1,
          shipToCity: orderData.shipToCity,
          shipToState: orderData.shipToState,
          shipToZip: orderData.shipToZip,
          shipToCountry: orderData.shipToCountry || 'USA'
        },
        lineItems: orderData.lineItems.map(item => ({
          inventoryKey: item.inventoryKey,
          quantity: item.quantity,
          sizeIndex: item.sizeIndex,
          warehouse: item.warehouse
        }))
      }
    };

    return new Promise((resolve, reject) => {
      client.submitPO(request, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  } catch (error) {
    throw new Error(`Submit PO Error: ${error.message}`);
  }
}

module.exports = {
  getPreSubmitInfo,
  submitPO
}; 