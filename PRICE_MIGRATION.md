# Design Price Structure Migration

## Overview

The design price structure has been updated to support multiple currencies per design instead of a single price and currency. This allows designs to have prices in both Indian Rupees (₹) and US Dollars ($) simultaneously.

## Changes Made

### 1. Database Schema Changes

**Old Structure:**

```javascript
{
  price: Number,
  currency: '₹' | '$'
}
```

**New Structure:**

```javascript
{
  prices: [
    {
      currency: '₹' | '$',
      price: Number,
    },
  ];
}
```

### 2. Updated Files

- `src/models/Design.ts` - Updated Mongoose schema
- `src/types/index.ts` - Updated TypeScript interfaces
- `src/app/api/designs/route.ts` - Updated API endpoints
- `src/app/api/designs/[id]/route.ts` - Updated individual design API
- `src/app/designs/page.tsx` - Updated UI components
- `src/app/orders/page.tsx` - Updated to work with new structure
- `scripts/setup.js` - Updated setup script
- `scripts/migrate-prices.js` - New migration script

### 3. UI Changes

- **Create Form**: Now supports adding multiple currency prices with a dynamic interface
- **Edit Form**: Updated to manage multiple prices
- **View Dialog**: Shows all prices for a design
- **Orders Page**: Updated to display the first available price

## Migration Process

### Step 1: Run Migration Script

```bash
node scripts/migrate-prices.js
```

This script will:

- Read all existing designs with the old price structure
- Convert them to the new prices array structure
- Save them to a new collection called `designs_new`

### Step 2: Database Collection Update

After running the migration script, you need to manually update the database:

1. **Backup your current designs collection**
2. **Drop the current `designs` collection**
3. **Rename `designs_new` to `designs`**

### Step 3: Deploy Updated Code

Deploy the updated application code that uses the new price structure.

## Features

### Multiple Currency Support

- Designs can now have prices in both ₹ and $ simultaneously
- Users can add up to 2 different currency prices per design
- Each price entry can be individually edited or removed

### Backward Compatibility

- The migration script preserves all existing data
- Orders and other related data continue to work with the new structure
- The first price in the array is used as the primary price for display

### UI Improvements

- Dynamic price management interface
- Add/remove price entries
- Currency selection dropdown
- Price validation and formatting

## Usage

### Adding Prices to a Design

1. Open the design creation or edit form
2. Click "Add Price" to add a new currency price
3. Select the currency (₹ or $)
4. Enter the price amount
5. Repeat for additional currencies (max 2)

### Viewing Prices

- In the designs list, the first available price is displayed
- In the view dialog, all prices are shown
- In orders, the first price is used for display

## Notes

- The migration is designed to be safe and non-destructive
- All existing functionality is preserved
- The new structure is more flexible for future currency additions
- TypeScript types have been updated to ensure type safety

## Troubleshooting

If you encounter issues during migration:

1. Check the migration script output for any errors
2. Ensure your MongoDB connection is working
3. Verify that the `designs` collection exists
4. Check that you have proper permissions to modify the database

For any questions or issues, please refer to the application logs or contact the development team.
