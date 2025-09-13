import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import InventoryEntry from '@/models/InventoryEntry';
import Supplier from '@/models/Supplier';
import Paper from '@/models/Paper';
import Plastic from '@/models/Plastic';
import Stone from '@/models/Stone';
import Tape from '@/models/Tape';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const inventoryType = searchParams.get('inventoryType');
    const entryType = searchParams.get('entryType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query: Record<string, unknown> = {};
    if (inventoryType) query.inventoryType = inventoryType;
    if (entryType) query.entryType = entryType;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate)
        (query.createdAt as Record<string, unknown>).$gte = new Date(startDate);
      if (endDate)
        (query.createdAt as Record<string, unknown>).$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      InventoryEntry.find(query)
        .populate('supplier', 'name contactPerson phone')
        .populate('enteredBy', 'name email')
        .populate('approvedBy', 'name email')
        .populate('sourceOrderId', 'orderNumber customerName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v'),
      InventoryEntry.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: entries,
      pagination: {
        current: page,
        pages: totalPages,
        total,
        limit,
      },
    });
  } catch (error) {
    console.error('Get inventory entries error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Starting inventory entry creation...');

    await dbConnect();
    console.log('Database connected successfully');

    const user = await getCurrentUser(request);
    if (!user) {
      console.log('No user found in request');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 },
      );
    }
    console.log('User authenticated:', user.email);

    const body = await request.json();
    console.log('Request body received:', JSON.stringify(body, null, 2));

    const {
      entryType,
      inventoryType,
      supplierId,
      supplierName,
      billNumber,
      billDate,
      items,
      totalAmount,
      notes,
      source,
      sourceOrderId,
      sourceDescription,
    } = body;

    // Validate required fields
    if (
      !entryType ||
      !inventoryType ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Allow 'mixed' inventory type for entries with multiple inventory types
    if (
      inventoryType !== 'mixed' &&
      !['paper', 'plastic', 'stones', 'tape'].includes(inventoryType)
    ) {
      return NextResponse.json(
        { success: false, message: 'Invalid inventory type' },
        { status: 400 },
      );
    }

    // Validate entry type specific fields
    if (entryType === 'purchase') {
      if ((!supplierId && !supplierName) || !billNumber || !billDate) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Supplier, bill number, and bill date are required for purchase entries',
          },
          { status: 400 },
        );
      }
    }

    if (entryType === 'return') {
      if (
        !source ||
        (source === 'order' && !sourceOrderId) ||
        (source === 'other' && !sourceDescription)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: 'Source information is required for return entries',
          },
          { status: 400 },
        );
      }
    }

    // Handle supplier for purchase entries
    let supplier = null;
    if (entryType === 'purchase') {
      if (supplierId) {
        // Use existing supplier by ID
        supplier = await Supplier.findById(supplierId);
        if (!supplier) {
          return NextResponse.json(
            { success: false, message: 'Supplier not found' },
            { status: 404 },
          );
        }
      } else if (supplierName) {
        // Find existing supplier by name or create new one
        supplier = await Supplier.findOne({ name: supplierName.trim() });
        if (!supplier) {
          // Create new supplier
          supplier = new Supplier({
            name: supplierName.trim(),
            contactPerson: '',
            phone: '',
            email: '',
            address: '',
            createdBy: user._id,
          });
          await supplier.save();
        }
      }
    }

    // Validate items and update inventory
    console.log('Validating items:', items);
    const inventoryUpdates = [];
    for (const item of items) {
      console.log('Processing item:', item);

      if (!item.itemId || !item.quantity || item.quantity <= 0) {
        console.log('Invalid item data:', item);
        return NextResponse.json(
          { success: false, message: 'Invalid item data' },
          { status: 400 },
        );
      }

      // Use the item's specific inventory type instead of the global inventoryType
      const itemInventoryType = item.inventoryType || inventoryType;
      console.log(
        `Looking for item ${item.itemId} in ${itemInventoryType} inventory`,
      );

      let inventoryItem;
      switch (itemInventoryType) {
        case 'paper':
          inventoryItem = await Paper.findById(item.itemId);
          break;
        case 'plastic':
          inventoryItem = await Plastic.findById(item.itemId);
          break;
        case 'stones':
          inventoryItem = await Stone.findById(item.itemId);
          break;
        case 'tape':
          inventoryItem = await Tape.findById(item.itemId);
          break;
        default:
          console.log('Invalid inventory type:', itemInventoryType);
          return NextResponse.json(
            { success: false, message: 'Invalid inventory type' },
            { status: 400 },
          );
      }

      if (!inventoryItem) {
        console.log(`Item not found: ${item.itemId} in ${itemInventoryType}`);
        return NextResponse.json(
          {
            success: false,
            message: `Item not found in ${itemInventoryType} inventory`,
          },
          { status: 404 },
        );
      }

      console.log('Found inventory item:', inventoryItem.name);

      // Calculate new quantity
      const newQuantity = inventoryItem.quantity + item.quantity;
      inventoryUpdates.push({
        model:
          itemInventoryType === 'paper'
            ? Paper
            : itemInventoryType === 'plastic'
            ? Plastic
            : itemInventoryType === 'stones'
            ? Stone
            : Tape,
        id: item.itemId,
        newQuantity,
        item,
        inventoryType: itemInventoryType,
      });
    }

    // Create inventory entry
    const inventoryEntry = new InventoryEntry({
      entryType,
      inventoryType,
      supplier: entryType === 'purchase' ? supplier?._id : undefined,
      billNumber: entryType === 'purchase' ? billNumber : undefined,
      billDate: entryType === 'purchase' ? new Date(billDate) : undefined,
      items: items.map((item) => ({
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        unit: item.unit || 'pcs',
        piecesPerRoll: item.piecesPerRoll,
        weightPerPiece: item.weightPerPiece,
        width: item.width,
      })),
      totalAmount,
      notes,
      source: entryType === 'return' ? source : undefined,
      sourceOrderId:
        entryType === 'return' && source === 'order'
          ? sourceOrderId
          : undefined,
      sourceDescription:
        entryType === 'return' && source === 'other'
          ? sourceDescription
          : undefined,
      enteredBy: user._id,
    });

    await inventoryEntry.save();

    // Update inventory quantities
    for (const update of inventoryUpdates) {
      const updateData: Record<string, unknown> = {
        quantity: update.newQuantity,
        updatedBy: user._id,
        $push: {
          updateHistory: {
            field: 'quantity',
            oldValue: update.newQuantity - update.item.quantity,
            newValue: update.newQuantity,
            updatedBy: user._id,
            updatedAt: new Date(),
            reason: `${entryType} entry - ${inventoryEntry._id}`,
          },
        },
      };

      // For paper, also update totalPieces
      if (update.inventoryType === 'paper' && update.item.piecesPerRoll) {
        updateData.totalPieces = update.newQuantity * update.item.piecesPerRoll;
      }

      await update.model.findByIdAndUpdate(update.id, updateData);
    }

    // Populate the response
    const populatedEntry = await InventoryEntry.findById(inventoryEntry._id)
      .populate('supplier', 'name contactPerson phone')
      .populate('enteredBy', 'name email')
      .populate('sourceOrderId', 'orderNumber customerName');

    return NextResponse.json({
      success: true,
      message: 'Inventory entry created successfully',
      data: populatedEntry,
    });
  } catch (error) {
    console.error('Create inventory entry error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
