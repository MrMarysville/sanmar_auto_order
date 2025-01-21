const mongoose = require('mongoose');

const InventoryMappingSchema = new mongoose.Schema({
  // Printavo fields
  printavoStyleCode: { 
    type: String, 
    required: true,
    trim: true,
    uppercase: true
  },
  color: { 
    type: String, 
    required: true,
    trim: true
  },
  size: { 
    type: String, 
    required: true,
    trim: true,
    uppercase: true
  },
  
  // SanMar fields
  sanmarInventoryKey: { 
    type: String, 
    required: true,
    trim: true,
    uppercase: true
  },
  sizeIndex: { 
    type: String, 
    required: true,
    trim: true,
    uppercase: true
  },
  warehouse: { 
    type: String, 
    default: 'ATL',
    trim: true,
    uppercase: true
  },

  // Additional metadata
  description: {
    type: String,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'inventory_mappings'
});

// Create a compound index for unique combinations
InventoryMappingSchema.index(
  { printavoStyleCode: 1, color: 1, size: 1 }, 
  { unique: true }
);

// Instance method to convert to SanMar format
InventoryMappingSchema.methods.toSanmarFormat = function() {
  return {
    inventoryKey: this.sanmarInventoryKey,
    sizeIndex: this.sizeIndex,
    warehouse: this.warehouse
  };
};

const InventoryMapping = mongoose.model('InventoryMapping', InventoryMappingSchema);

module.exports = InventoryMapping; 