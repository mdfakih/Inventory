# Total Pieces Migration - Inventory Calculation Fix

## Problem Description

The inventory system had a critical flaw in how it calculated and tracked paper inventory:

1. **Incorrect Calculation**: The system was calculating total pieces as `quantity * piecesPerRoll` on-the-fly, which led to rounding errors and incorrect inventory tracking.

2. **Example Issue**:

   - Initial: 6000 total pieces (quantity \* piecesPerRoll)
   - Order 500 pieces → Should be 5500 remaining, but became 5250
   - Change to 100 pieces → Should be 5900, but stayed at 5250

3. **Root Cause**: The `Math.floor()` function used in inventory adjustments was causing pieces to be lost due to rounding down when converting between total pieces and quantity (rolls).

## Solution Implemented

### 1. Database Schema Changes

**Added `totalPieces` field to Paper model:**

```typescript
totalPieces: {
  type: Number,
  required: true,
  min: 0,
  default: 0,
}
```

### 2. API Logic Updates

**Order Creation (`/api/orders/route.ts`):**

- Changed validation to use `paper.totalPieces` instead of `paper.quantity * paper.piecesPerRoll`
- Updated inventory deduction to directly modify `totalPieces` field
- Fixed rollback logic to restore correct `totalPieces`

**Order Updates (`/api/orders/[id]/route.ts`):**

- Updated inventory validation to use `totalPieces`
- Fixed inventory adjustment logic to work with `totalPieces`
- Updated order finalization logic for out orders

**Paper Management (`/api/inventory/paper/[id]/route.ts`):**

- Added PATCH method for quantity updates
- Updated DELETE method to reset both `quantity` and `totalPieces`
- Ensured `totalPieces` is calculated correctly when quantity is updated

### 3. Frontend Updates

**Updated TypeScript interfaces:**

- Added `totalPieces: number` to Paper interface in all components
- Updated table displays to show `paper.totalPieces` instead of calculated value

**Components updated:**

- `src/components/inventory/paper-table.tsx`
- `src/app/inventory/out/page.tsx`
- `src/app/masters/page.tsx`
- `src/app/orders/page.tsx`

### 4. Migration Script

Created `scripts/migrate-total-pieces.js` to update existing records:

- Finds all paper records without `totalPieces` field
- Calculates `totalPieces = quantity * piecesPerRoll` for each record
- Updates the database with the correct values

## How to Apply the Migration

1. **Ensure MongoDB is running and accessible**
2. **Set the MONGODB_URI environment variable** (same as used by the application)
3. **Run the migration script:**
   ```bash
   node scripts/migrate-total-pieces.js
   ```

## Benefits of the Fix

1. **Accurate Inventory Tracking**: Direct tracking of total pieces eliminates calculation errors
2. **No More Lost Pieces**: Eliminates rounding errors that caused pieces to disappear
3. **Consistent Data**: All inventory operations now work with the same total pieces value
4. **Better Analytics**: Accurate inventory data enables reliable reporting and analytics
5. **Audit Trail**: The `totalPieces` field provides a clear record of actual inventory levels

## Testing the Fix

To verify the fix works correctly:

1. **Create a paper record** with known values (e.g., 10 rolls, 500 pieces per roll = 5000 total pieces)
2. **Create an order** for 1000 pieces
3. **Verify inventory** shows 4000 total pieces remaining
4. **Update the order** to 500 pieces
5. **Verify inventory** shows 4500 total pieces remaining

## Important Notes

- **Backup your database** before running the migration
- **Test in a development environment** first
- **Monitor the application** after deployment to ensure all inventory operations work correctly
- **Update any external integrations** that might rely on the old calculation method

## Rollback Plan

If issues arise, the system can be rolled back by:

1. Reverting the code changes
2. Running a reverse migration to remove the `totalPieces` field
3. Restoring from database backup if necessary

However, this fix addresses a critical business logic error and should significantly improve inventory accuracy.
