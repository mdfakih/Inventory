import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Customer from '@/models/Customer';
import { getCurrentUser } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid customer ID format' },
        { status: 400 },
      );
    }
    
    const customer = await Customer.findById(id)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');
    
    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid customer ID format' },
        { status: 400 },
      );
    }
    
    const user = await getCurrentUser(request);
    if (!user?._id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Check if phone number is being changed and if it conflicts with another customer
    if (body.phone) {
      const existingCustomer = await Customer.findOne({
        phone: body.phone,
        _id: { $ne: id },
      });
      if (existingCustomer) {
        return NextResponse.json(
          { success: false, message: 'Customer with this phone number already exists' },
          { status: 400 }
        );
      }
    }
    
    const customer = await Customer.findById(id);
    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Track changes for update history
    const updateHistory = [];
    for (const [key, value] of Object.entries(body)) {
      if (key !== 'updateHistory' && customer[key] !== value) {
        updateHistory.push({
          field: key,
          oldValue: customer[key],
          newValue: value,
          updatedBy: user._id,
          updatedAt: new Date(),
        });
      }
    }
    
    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      {
        ...body,
        updatedBy: user._id,
        $push: { updateHistory: { $each: updateHistory } },
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name').populate('updatedBy', 'name');
    
    return NextResponse.json({
      success: true,
      message: 'Customer updated successfully',
      data: updatedCustomer,
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    const user = await getCurrentUser(request);
    if (!user?._id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const customer = await Customer.findById(id);
    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Soft delete - mark as inactive instead of removing
    await Customer.findByIdAndUpdate(id, {
      isActive: false,
      updatedBy: user._id,
    });
    
    return NextResponse.json({
      success: true,
      message: 'Customer deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
