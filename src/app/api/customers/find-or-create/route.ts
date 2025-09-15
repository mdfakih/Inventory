import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Customer from '@/models/Customer';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const user = await getCurrentUser(request);
    if (!user?._id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { name, phone, email, company, address } = body;
    
    if (!name || !phone) {
      return NextResponse.json(
        { success: false, message: 'Name and phone are required' },
        { status: 400 }
      );
    }
    
    // First, try to find existing customer by phone (exact match)
    let customer = await Customer.findOne({ phone: phone.trim() });
    
    if (customer) {
      // Update customer if new information is provided
      const updates: {
        name?: string;
        email?: string;
        company?: string;
        address?: {
          street?: string;
          city?: string;
          state?: string;
          pincode?: string;
        };
        updatedBy?: string;
        updateHistory?: Array<{
          field: string;
          oldValue: string | null;
          newValue: string;
          updatedBy: string;
          updatedAt: Date;
        }>;
      } = {};
      let hasUpdates = false;
      
      if (name && name !== customer.name) {
        updates.name = name;
        hasUpdates = true;
      }
      
      if (email && email !== customer.email) {
        updates.email = email;
        hasUpdates = true;
      }
      
      if (company && company !== customer.company) {
        updates.company = company;
        hasUpdates = true;
      }
      
      if (address && (
        address.street !== customer.address?.street ||
        address.city !== customer.address?.city ||
        address.state !== customer.address?.state ||
        address.pincode !== customer.address?.pincode
      )) {
        updates.address = address;
        hasUpdates = true;
      }
      
      if (hasUpdates) {
        updates.updatedBy = user._id;
        updates.updateHistory = [
          ...(customer.updateHistory || []),
          {
            field: 'order_update',
            oldValue: 'Customer updated via order',
            newValue: 'Customer updated via order',
            updatedBy: user._id,
            updatedAt: new Date(),
          }
        ];
        
        customer = await Customer.findByIdAndUpdate(
          customer._id,
          updates,
          { new: true, runValidators: true }
        ).populate('createdBy', 'name').populate('updatedBy', 'name');
      }
      
      return NextResponse.json({
        success: true,
        message: 'Existing customer found and updated',
        data: customer,
        isNew: false,
      });
    }
    
    // If no customer found by phone, try to find by name (fuzzy match)
    customer = await Customer.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    
    if (customer) {
      // Update phone if different
      if (phone !== customer.phone) {
        customer = await Customer.findByIdAndUpdate(
          customer._id,
          {
            phone: phone.trim(),
            updatedBy: user._id,
            $push: {
              updateHistory: {
                field: 'phone_update',
                oldValue: customer.phone,
                newValue: phone.trim(),
                updatedBy: user._id,
                updatedAt: new Date(),
              }
            }
          },
          { new: true, runValidators: true }
        ).populate('createdBy', 'name').populate('updatedBy', 'name');
      }
      
      return NextResponse.json({
        success: true,
        message: 'Existing customer found by name and phone updated',
        data: customer,
        isNew: false,
      });
    }
    
    // Create new customer
    const newCustomer = new Customer({
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || undefined,
      company: company?.trim() || undefined,
      address: address || undefined,
      customerType: 'retail', // Default type
      creditLimit: 0,
      paymentTerms: 'immediate',
      isActive: true,
      createdBy: user._id,
      updateHistory: [{
        field: 'created',
        oldValue: null,
        newValue: 'Customer created via order',
        updatedBy: user._id,
        updatedAt: new Date(),
      }],
    });
    
    await newCustomer.save();
    
    const populatedCustomer = await Customer.findById(newCustomer._id)
      .populate('createdBy', 'name');
    
    return NextResponse.json({
      success: true,
      message: 'New customer created successfully',
      data: populatedCustomer,
      isNew: true,
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error finding or creating customer:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process customer' },
      { status: 500 }
    );
  }
}
