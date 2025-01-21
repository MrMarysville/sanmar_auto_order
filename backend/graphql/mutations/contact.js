/**
 * @typedef {Object} ContactCreateInput
 * @property {string} fullName - Full name of the contact
 * @property {string} email - Email address
 * @property {string} [phone] - Phone number
 * @property {Object} [address] - Contact address
 * @property {string} address.address1 - Street address line 1
 * @property {string} [address.address2] - Street address line 2
 * @property {string} address.city - City
 * @property {string} address.stateIso - State/Province ISO code
 * @property {string} address.zipCode - Postal/ZIP code
 * @property {string} address.countryIso - Country ISO code
 * @property {boolean} [primaryContact] - Whether this is a primary contact
 * @property {Object} [company] - Associated company
 * @property {string} company.id - Company ID
 */

const CREATE_CONTACT = `
  mutation CreateContact($input: ContactCreateInput!) {
    contactCreate(input: $input) {
      contact {
        id
        fullName
        email
        phone
        address {
          address1
          address2
          city
          stateIso
          zipCode
          countryIso
        }
        primaryContact
        company {
          id
          name
        }
      }
      errors {
        message
        path
      }
    }
  }
`;

const UPDATE_CONTACT = `
  mutation UpdateContact($id: ID!, $input: ContactUpdateInput!) {
    contactUpdate(id: $id, input: $input) {
      contact {
        id
        fullName
        email
        phone
        address {
          address1
          address2
          city
          stateIso
          zipCode
          countryIso
        }
        primaryContact
        company {
          id
          name
        }
      }
      errors {
        message
        path
      }
    }
  }
`;

const DELETE_CONTACT = `
  mutation DeleteContact($id: ID!) {
    contactDelete(id: $id) {
      success
      errors {
        message
        path
      }
    }
  }
`;

module.exports = {
  CREATE_CONTACT,
  UPDATE_CONTACT,
  DELETE_CONTACT
};
