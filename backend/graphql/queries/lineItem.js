/**
 * @typedef {Object} LineItemFragment
 * @property {string} id - Line item ID
 * @property {Object} product - Product information
 * @property {string} product.id - Product ID
 * @property {string} product.name - Product name
 * @property {string} product.sku - Product SKU
 * @property {string} product.description - Product description
 * @property {Object} product.category - Product category
 * @property {number} quantity - Quantity ordered
 * @property {string} size - Size selected
 * @property {string} color - Color selected
 * @property {number} price - Price per unit
 * @property {number} cost - Cost per unit
 * @property {number} markup - Markup percentage
 * @property {number} profit - Profit amount
 */

const GET_LINE_ITEM = `
  query GetLineItem($id: ID!) {
    lineItem(id: $id) {
      id
      product {
        id
        name
        sku
        description
        category {
          id
          name
        }
      }
      quantity
      size
      color
      price
      cost
      markup
      profit
      mockups {
        nodes {
          id
          url
          position
        }
      }
      imprints {
        nodes {
          id
          name
          description
          location
          colors
          mockupUrl
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
  GET_LINE_ITEM
};
