/**
 * @typedef {Object} LineItemCreateInput
 * @property {Object} product - Product information
 * @property {string} product.id - Product ID
 * @property {number} quantity - Quantity ordered
 * @property {string} [size] - Size selected
 * @property {string} [color] - Color selected
 * @property {number} [price] - Price per unit
 * @property {number} [cost] - Cost per unit
 * @property {number} [markup] - Markup percentage
 * @property {Array<{
 *   name: string,
 *   description?: string,
 *   location: string,
 *   colors: Array<string>
 * }>} [imprints] - Array of imprint specifications
 */

const CREATE_LINE_ITEM = `
  mutation CreateLineItem($input: LineItemCreateInput!) {
    lineItemCreate(input: $input) {
      lineItem {
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
      }
      errors {
        message
        path
      }
    }
  }
`;

const UPDATE_LINE_ITEM = `
  mutation UpdateLineItem($id: ID!, $input: LineItemUpdateInput!) {
    lineItemUpdate(id: $id, input: $input) {
      lineItem {
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
      }
      errors {
        message
        path
      }
    }
  }
`;

const DELETE_LINE_ITEM = `
  mutation DeleteLineItem($id: ID!) {
    lineItemDelete(id: $id) {
      success
      errors {
        message
        path
      }
    }
  }
`;

module.exports = {
  CREATE_LINE_ITEM,
  UPDATE_LINE_ITEM,
  DELETE_LINE_ITEM
};
