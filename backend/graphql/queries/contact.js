/**
 * @typedef {Object} ContactFragment
 * @property {string} id - Contact ID
 * @property {string} fullName - Full name
 * @property {string} email - Email address
 * @property {string} phone - Phone number
 * @property {Object} address - Contact address
 * @property {string} address.address1 - Street address line 1
 * @property {string} [address.address2] - Street address line 2
 * @property {string} address.city - City
 * @property {string} address.stateIso - State/Province ISO code
 * @property {string} address.zipCode - Postal/ZIP code
 * @property {string} address.countryIso - Country ISO code
 * @property {boolean} primaryContact - Whether this is a primary contact
 * @property {Object} company - Associated company
 * @property {string} company.id - Company ID
 * @property {string} company.name - Company name
 */

/**
 * @typedef {Object} ContactSearchOptions
 * @property {string} query - Search query (email, name, or phone)
 * @property {number} [first=25] - Number of results to return (max 25)
 * @property {string} [after] - Cursor for pagination
 * @property {boolean} [primaryOnly=false] - Only search primary contacts
 * @property {string} [sortOn='CREATED_AT'] - Field to sort on
 * @property {boolean} [sortDescending=true] - Sort in descending order
 */

const SEARCH_CONTACTS = `
  query SearchContacts(
    $query: String!
    $first: Int
    $after: String
    $primaryOnly: Boolean
    $sortOn: ContactSortField
    $sortDescending: Boolean
  ) {
    contacts(
      query: $query
      first: $first
      after: $after
      primaryOnly: $primaryOnly
      sortOn: $sortOn
      sortDescending: $sortDescending
    ) {
      nodes {
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
        timestamps {
          createdAt
          updatedAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalNodes
    }
  }
`;

const GET_CONTACT = `
  query GetContact($id: ID!) {
    contact(id: $id) {
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
      invoices(first: 5) {
        nodes {
          id
          visualId
          customerDueAt
          status {
            id
            name
          }
        }
      }
      timestamps {
        createdAt
        updatedAt
      }
    }
  }
`;

module.exports = {
  SEARCH_CONTACTS,
  GET_CONTACT
};
