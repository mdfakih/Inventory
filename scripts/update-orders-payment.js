require("dotenv").config({ path: ".env.local" });
const { MongoClient } = require("mongodb");

async function updateOrdersPayment() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI environment variable is not set");
    process.exit(1);
  }

  console.log("MONGODB_URI:", uri);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();
    const ordersCollection = db.collection("orders");

    // Update all existing orders to add default payment and pricing fields
    const result = await ordersCollection.updateMany(
      {
        // Find orders that don't have the new fields
        $or: [
          { modeOfPayment: { $exists: false } },
          { discountType: { $exists: false } },
          { discountValue: { $exists: false } },
          { totalCost: { $exists: false } },
          { discountedAmount: { $exists: false } },
          { finalAmount: { $exists: false } },
        ],
      },
      {
        $set: {
          modeOfPayment: "cash",
          discountType: "percentage",
          discountValue: 0,
          totalCost: 0,
          discountedAmount: 0,
          finalAmount: 0,
        },
      }
    );

    console.log(
      `Updated ${result.modifiedCount} orders with default payment fields`
    );

    // Now calculate actual pricing for orders that have design prices
    const ordersToUpdate = await ordersCollection
      .find({
        "designId.prices": { $exists: true, $ne: [] },
      })
      .toArray();

    console.log(
      `Found ${ordersToUpdate.length} orders with design prices to update`
    );

    for (const order of ordersToUpdate) {
      try {
        const design = order.designId;
        if (design && design.prices && design.prices.length > 0) {
          const designPrice = design.prices[0].price;
          const quantity = order.paperUsed?.quantityInPcs || 0;
          const totalCost = designPrice * quantity;

          // Calculate discount and final amount
          const discountValue = order.discountValue || 0;
          const discountType = order.discountType || "percentage";
          let discountedAmount = 0;

          if (discountType === "percentage") {
            discountedAmount = (totalCost * discountValue) / 100;
          } else {
            discountedAmount = discountValue;
          }

          const finalAmount = totalCost - discountedAmount;

          await ordersCollection.updateOne(
            { _id: order._id },
            {
              $set: {
                totalCost,
                discountedAmount,
                finalAmount,
              },
            }
          );
        }
      } catch (error) {
        console.error(`Error updating order ${order._id}:`, error);
      }
    }

    console.log("Payment fields update completed successfully");
  } catch (error) {
    console.error("Error updating orders:", error);
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

// Run the migration
updateOrdersPayment();
