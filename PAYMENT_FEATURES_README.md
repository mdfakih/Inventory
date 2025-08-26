# Payment and Pricing Features for Orders

This document outlines the new payment and pricing features that have been added to the Orders system.

## New Fields Added

### Order Model Updates
The Order model has been extended with the following new fields:

- **modeOfPayment**: Payment method (cash, UPI, or card)
- **discountType**: Type of discount (percentage or flat amount)
- **discountValue**: Value of the discount
- **totalCost**: Base cost before discount
- **discountedAmount**: Calculated discount amount
- **finalAmount**: Final amount after discount

### Database Schema Changes
```javascript
// Payment and pricing fields
modeOfPayment: {
  type: String,
  enum: ['cash', 'UPI', 'card'],
  default: 'cash',
},
discountType: {
  type: String,
  enum: ['percentage', 'flat'],
  default: 'percentage',
},
discountValue: {
  type: Number,
  min: 0,
  default: 0,
},
totalCost: {
  type: Number,
  min: 0,
  default: 0,
},
discountedAmount: {
  type: Number,
  min: 0,
  default: 0,
},
finalAmount: {
  type: Number,
  min: 0,
  default: 0,
},
```

## Frontend Updates

### Create Order Form
- Added Mode of Payment dropdown (Cash, UPI, Card)
- Added Discount Type dropdown (Percentage, Flat Amount)
- Added Discount Value input field
- Real-time calculation display showing:
  - Base Cost
  - Discount Amount
  - Final Amount

### Edit Order Form
- Same fields as Create Order form
- Pre-populated with existing values
- Real-time calculation updates

### View Order Dialog
- Displays all payment and pricing information
- Shows mode of payment, total cost, discount, and final amount

### Orders Table
- Added new columns: Payment, Total Cost, Final Amount
- Payment column shows mode of payment as a badge
- Total Cost and Final Amount columns show formatted currency values

## API Updates

### POST /api/orders
- Accepts new payment and pricing fields
- Automatically calculates total cost based on design price and quantity
- Sets default values for new fields

### PUT /api/orders/:id
- Accepts updates to payment and pricing fields
- Recalculates pricing when discount or payment fields change
- Maintains audit trail of changes

## Pricing Calculations

### Base Cost Calculation
```
totalCost = designPrice × quantity
```

### Discount Calculation
```
// For percentage discount
discountedAmount = (totalCost × discountValue) / 100

// For flat discount
discountedAmount = discountValue
```

### Final Amount Calculation
```
finalAmount = totalCost - discountedAmount
```

## Migration

### Running the Migration Script
To update existing orders with the new fields:

1. Ensure your environment variables are set (MONGODB_URI)
2. Run the migration script:
   ```bash
   node scripts/update-orders-payment.js
   ```

### What the Migration Does
1. Adds default payment fields to all existing orders
2. Calculates actual pricing for orders with design prices
3. Updates totalCost, discountedAmount, and finalAmount fields

## Usage Examples

### Creating an Order with Discount
```javascript
const orderData = {
  type: 'out',
  customerName: 'John Doe',
  phone: '+1234567890',
  designId: 'design123',
  paperUsed: {
    sizeInInch: 12,
    quantityInPcs: 100
  },
  modeOfPayment: 'UPI',
  discountType: 'percentage',
  discountValue: 10 // 10% discount
};
```

### Updating Payment Information
```javascript
const updateData = {
  modeOfPayment: 'card',
  discountType: 'flat',
  discountValue: 50 // ₹50 flat discount
};
```

## Benefits

1. **Better Financial Tracking**: Complete visibility into order costs and discounts
2. **Flexible Payment Options**: Support for multiple payment methods
3. **Automated Calculations**: Real-time pricing calculations with discounts
4. **Audit Trail**: Track all changes to payment and pricing information
5. **Professional Invoicing**: Ready for generating professional invoices

## Future Enhancements

- Multiple currency support
- Tax calculations
- Payment status tracking
- Invoice generation
- Payment gateway integration
- Bulk discount rules
- Customer-specific pricing
