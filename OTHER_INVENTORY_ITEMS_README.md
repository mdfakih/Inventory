# Other Inventory Items in Orders

This document describes the new functionality for including other inventory items (plastic, tape, etc.) in orders, with automatic inventory deduction and validation.

## Overview

The order system now supports optional inventory items beyond the standard paper and stones. When creating or editing orders, users can add plastic, tape, and other inventory items that will be automatically deducted from inventory when the order is created.

## Features

### 1. Optional Inventory Items
- **Plastic**: Various types and sizes of plastic materials
- **Tape**: Different types of adhesive tapes
- **Other**: Extensible for future inventory types

### 2. Automatic Inventory Validation
- Checks if items exist in inventory
- Validates sufficient quantity is available
- Shows specific error messages for insufficient stock

### 3. Automatic Inventory Deduction
- Deducts used quantities from inventory when order is created
- Supports rollback if order creation fails
- Maintains data integrity

### 4. User-Friendly Interface
- Dynamic form fields for adding/removing items
- Dropdown selection for item types and specific items
- Quantity and unit inputs
- Real-time validation

## Database Schema Changes

### Order Model Updates

The Order model has been extended to include other inventory items:

```typescript
// In designOrders array
otherItemsUsed: [
  {
    itemType: 'plastic' | 'tape' | 'other';
    itemId: ObjectId; // Reference to Plastic, Tape, or other models
    quantity: number;
    unit: string; // 'pcs', 'rolls', 'meters', etc.
  }
]

// Legacy field for backward compatibility
otherItemsUsed: [
  {
    itemType: 'plastic' | 'tape' | 'other';
    itemId: ObjectId;
    quantity: number;
    unit: string;
  }
]
```

### Inventory Models

The system uses existing inventory models:

- **Plastic**: `src/models/Plastic.ts`
- **Tape**: `src/models/Tape.ts`

## API Changes

### Order Creation (`POST /api/orders`)

The order creation endpoint now accepts and processes other inventory items:

```typescript
interface CreateOrderData {
  // ... existing fields
  designOrders: Array<{
    // ... existing fields
    otherItemsUsed?: Array<{
      itemType: 'plastic' | 'tape' | 'other';
      itemId: string;
      quantity: number;
      unit?: string;
    }>;
  }>;
}
```

### Validation Process

1. **Item Existence Check**: Verifies each item exists in the appropriate collection
2. **Quantity Validation**: Ensures sufficient stock is available
3. **Inventory Deduction**: Automatically deducts used quantities
4. **Rollback Support**: Restores inventory if order creation fails

### Error Handling

The API returns specific error messages for inventory issues:

```json
{
  "success": false,
  "message": "Insufficient inventory",
  "errors": [
    "Insufficient plastic stock: Test Plastic (available: 100pcs, required: 150pcs)",
    "Plastic item not found",
    "Unknown item type: invalid_type"
  ]
}
```

## Frontend Implementation

### Form Structure

The order creation form now includes an "Other Inventory Items" section:

```tsx
{/* Other Inventory Items Section */}
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <h4 className="font-medium text-sm text-muted-foreground">
      Other Inventory Items (Optional)
    </h4>
    <Button onClick={() => addOtherItem(index)}>
      <Plus className="h-4 w-4 mr-1" />
      Add Item
    </Button>
  </div>
  
  {designOrder.otherItemsUsed.map((item, itemIndex) => (
    <div key={itemIndex} className="p-3 border rounded-lg space-y-3">
      {/* Item Type Selection */}
      <Select value={item.itemType} onValueChange={...}>
        <SelectItem value="plastic">Plastic</SelectItem>
        <SelectItem value="tape">Tape</SelectItem>
      </Select>
      
      {/* Item Selection */}
      <Select value={item.itemId} onValueChange={...}>
        {item.itemType === 'plastic' && plastics.map(...)}
        {item.itemType === 'tape' && tapes.map(...)}
      </Select>
      
      {/* Quantity and Unit */}
      <Input type="number" value={item.quantity} onChange={...} />
      <Select value={item.unit} onValueChange={...}>
        <SelectItem value="pcs">Pieces</SelectItem>
        <SelectItem value="rolls">Rolls</SelectItem>
        <SelectItem value="meters">Meters</SelectItem>
      </Select>
    </div>
  ))}
</div>
```

### State Management

Helper functions for managing other items:

```typescript
const addOtherItem = (designOrderIndex: number) => {
  setFormData((prev) => ({
    ...prev,
    designOrders: prev.designOrders.map((order, i) =>
      i === designOrderIndex
        ? {
            ...order,
            otherItemsUsed: [
              ...order.otherItemsUsed,
              {
                itemType: 'plastic',
                itemId: '',
                quantity: 0,
                unit: 'pcs',
              },
            ],
          }
        : order,
    ),
  }));
};

const removeOtherItem = (designOrderIndex: number, itemIndex: number) => {
  setFormData((prev) => ({
    ...prev,
    designOrders: prev.designOrders.map((order, i) =>
      i === designOrderIndex
        ? {
            ...order,
            otherItemsUsed: order.otherItemsUsed.filter(
              (_, idx) => idx !== itemIndex,
            ),
          }
        : order,
    ),
  }));
};

const updateOtherItem = (
  designOrderIndex: number,
  itemIndex: number,
  field: 'itemType' | 'itemId' | 'quantity' | 'unit',
  value: string | number,
) => {
  setFormData((prev) => ({
    ...prev,
    designOrders: prev.designOrders.map((order, i) =>
      i === designOrderIndex
        ? {
            ...order,
            otherItemsUsed: order.otherItemsUsed.map((item, idx) =>
              idx === itemIndex
                ? { ...item, [field]: value }
                : item,
            ),
          }
        : order,
    ),
  }));
};
```

## Usage Examples

### Creating an Order with Other Items

1. **Navigate to Orders page**
2. **Click "Create Order"**
3. **Fill in customer details**
4. **Add design orders with paper and stones**
5. **In the "Other Inventory Items" section:**
   - Click "Add Item"
   - Select item type (Plastic/Tape)
   - Choose specific item from dropdown
   - Enter quantity and unit
   - Repeat for additional items
6. **Complete payment and pricing details**
7. **Submit order**

### Error Scenarios

**Insufficient Stock:**
```
Error: Insufficient plastic stock: Test Plastic (available: 100pcs, required: 150pcs)
```

**Item Not Found:**
```
Error: Plastic item not found
```

**Invalid Item Type:**
```
Error: Unknown item type: invalid_type
```

## Testing

### Test Script

Use the provided test script to create sample data:

```bash
node scripts/test-other-items.js
```

This script creates:
- Test plastic items
- Test tape items
- Test paper and stones
- Test design
- Sample order data structure

### Manual Testing

1. **Create inventory items** in the Masters section
2. **Create an order** with other inventory items
3. **Verify inventory deduction** by checking inventory levels
4. **Test error scenarios** by using insufficient quantities

## Backward Compatibility

The implementation maintains full backward compatibility:

- Existing orders without other items continue to work
- Legacy fields are preserved for existing data
- API responses include both new and old field structures

## Future Enhancements

Potential improvements for future versions:

1. **Additional Item Types**: Support for more inventory categories
2. **Batch Operations**: Bulk inventory updates
3. **Advanced Validation**: Cross-item dependencies
4. **Reporting**: Enhanced reports including other inventory usage
5. **Notifications**: Low stock alerts for other inventory items

## Technical Notes

### Database Indexes

Ensure proper indexing for performance:

```javascript
// Plastic model
plasticSchema.index({ name: 1 }, { unique: true });

// Tape model  
tapeSchema.index({ name: 1 }, { unique: true });
```

### Transaction Safety

The inventory deduction process uses MongoDB transactions to ensure data consistency:

1. Validate all inventory items
2. Deduct quantities atomically
3. Create order
4. Rollback on failure

### Error Recovery

If order creation fails after inventory deduction:

1. Restore original inventory quantities
2. Log the rollback operation
3. Return appropriate error message to user

## Support

For issues or questions regarding the other inventory items functionality:

1. Check the error messages for specific guidance
2. Verify inventory data integrity
3. Review the order creation logs
4. Contact the development team with specific error details
