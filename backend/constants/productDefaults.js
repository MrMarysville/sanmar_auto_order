/**
 * Standard size distributions for different market segments
 */
const SIZE_DISTRIBUTIONS = {
  STANDARD_RETAIL: {
    "S": 1,
    "M": 2,
    "L": 2,
    "XL": 1
  },
  STANDARD_PLUS: {
    "S": 1,
    "M": 2,
    "L": 2,
    "XL": 2,
    "2XL": 1
  },
  YOUTH: {
    "YXS": 1,
    "YS": 2,
    "YM": 2,
    "YL": 1
  },
  UNIFORM: {
    "S": 2,
    "M": 3,
    "L": 3,
    "XL": 2
  },
  CORPORATE: {
    "M": 3,
    "L": 4,
    "XL": 2,
    "2XL": 1
  }
};

/**
 * Common product categories with their typical configurations
 */
const PRODUCT_DEFAULTS = {
  TSHIRT: {
    defaultSizing: "STANDARD_RETAIL",
    commonColors: ["Black", "White", "Navy", "Gray"],
    commonLocations: ["Front Center", "Back Center", "Left Chest"]
  },
  POLO: {
    defaultSizing: "CORPORATE",
    commonColors: ["Black", "Navy", "White"],
    commonLocations: ["Left Chest", "Right Chest", "Right Sleeve"]
  },
  HOODIE: {
    defaultSizing: "STANDARD_PLUS",
    commonColors: ["Black", "Gray", "Navy"],
    commonLocations: ["Front Center", "Back Center", "Left Chest"]
  },
  YOUTH_TSHIRT: {
    defaultSizing: "YOUTH",
    commonColors: ["Black", "White", "Navy", "Red"],
    commonLocations: ["Front Center", "Back Center"]
  }
};

/**
 * Standard imprint locations with their typical specifications
 */
const IMPRINT_LOCATIONS = {
  "Front Center": {
    maxWidth: "12 inches",
    maxHeight: "14 inches",
    commonColors: 4
  },
  "Back Center": {
    maxWidth: "12 inches",
    maxHeight: "14 inches",
    commonColors: 4
  },
  "Left Chest": {
    maxWidth: "4 inches",
    maxHeight: "4 inches",
    commonColors: 2
  },
  "Right Chest": {
    maxWidth: "4 inches",
    maxHeight: "4 inches",
    commonColors: 2
  },
  "Right Sleeve": {
    maxWidth: "3 inches",
    maxHeight: "3 inches",
    commonColors: 1
  },
  "Left Sleeve": {
    maxWidth: "3 inches",
    maxHeight: "3 inches",
    commonColors: 1
  }
};

module.exports = {
  SIZE_DISTRIBUTIONS,
  PRODUCT_DEFAULTS,
  IMPRINT_LOCATIONS
}; 