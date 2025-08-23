const mongoose = require('mongoose');
require('dotenv').config();

async function updateOrderWeights() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Import models
    const Order = require('../src/models/Order');
    const Design = require('../src/models/Design');
    const Stone = require('../src/models/Stone');

    // Get all orders
    const orders = await Order.find().populate('designId');
    console.log(`Found ${orders.length} orders to update`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const order of orders) {
      try {
        // Get the design
        const design = await Design.findById(order.designId._id);
        if (!design) {
          console.log(`Design not found for order ${order._id}, skipping...`);
          errorCount++;
          continue;
        }

        // Calculate stone weight as per design (sum of all stone weights for the design)
        let designStoneWeight = 0;
        if (design.defaultStones && design.defaultStones.length > 0) {
          for (const designStone of design.defaultStones) {
            const stone = await Stone.findById(designStone.stoneId);
            if (stone) {
              // Use weightPerPiece if available, otherwise use quantity as fallback
              designStoneWeight += stone.weightPerPiece || stone.quantity || 0;
            }
          }
        }

        // Calculate new weight using the formula: (paper weight per pc + stone weight as per design) * number of pieces
        const paperWeightPerPiece = order.paperUsed.paperWeightPerPc;
        const totalWeightPerPiece = paperWeightPerPiece + designStoneWeight;
        const newCalculatedWeight = totalWeightPerPiece * order.paperUsed.quantityInPcs;

        // Update the order with new calculated weight
        await Order.findByIdAndUpdate(order._id, {
          calculatedWeight: newCalculatedWeight,
        });

        console.log(`Updated order ${order._id}: ${order.calculatedWeight}g -> ${newCalculatedWeight}g`);
        updatedCount++;

      } catch (error) {
        console.error(`Error updating order ${order._id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\nUpdate completed:`);
    console.log(`- Successfully updated: ${updatedCount} orders`);
    console.log(`- Errors: ${errorCount} orders`);

  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
updateOrderWeights();
