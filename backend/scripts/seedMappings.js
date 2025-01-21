require('dotenv').config();
const connectDB = require('../db');
const InventoryMapping = require('../models/InventoryMapping');

const sampleMappings = [
  {
    printavoStyleCode: 'PC61',
    color: 'Black',
    size: 'L',
    sanmarInventoryKey: 'PC61BLK',
    sizeIndex: 'L',
    warehouse: 'ATL',
    description: 'Port & Company Essential T-Shirt - Black'
  },
  {
    printavoStyleCode: 'PC61',
    color: 'Navy',
    size: 'XL',
    sanmarInventoryKey: 'PC61NVY',
    sizeIndex: 'XL',
    warehouse: 'ATL',
    description: 'Port & Company Essential T-Shirt - Navy'
  }
];

async function seedDatabase() {
  try {
    await connectDB();
    
    // Clear existing mappings if needed
    console.log('Clearing existing mappings...');
    await InventoryMapping.deleteMany({});
    
    // Insert new mappings
    console.log('Inserting sample mappings...');
    await InventoryMapping.insertMany(sampleMappings);
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase(); 