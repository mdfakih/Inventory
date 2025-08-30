export interface User {
  _id: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'employee';
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Stone {
  _id: string;
  name: string;
  number: string;
  color: string;
  size: string;
  quantity: number;
  unit: 'g' | 'kg';
  inventoryType: 'internal' | 'out';
  createdAt: Date;
  updatedAt: Date;
}

export interface Paper {
  _id: string;
  name: string;
  width: number;
  quantity: number;
  totalPieces: number;
  unit: 'pcs';
  piecesPerRoll: number;
  weightPerPiece: number;
  inventoryType: 'internal' | 'out';
  updatedBy?: string;
  updateHistory: Array<{
    field: string;
    oldValue: string | number | boolean | Date;
    newValue: string | number | boolean | Date;
    updatedBy: string;
    updatedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Plastic {
  _id: string;
  width: 12 | 14 | 16 | 18 | 20;
  quantity: number;
  unit: 'pcs';
  createdAt: Date;
  updatedAt: Date;
}

export interface Tape {
  _id: string;
  quantity: number;
  unit: 'pcs';
  createdAt: Date;
  updatedAt: Date;
}

export interface Design {
  _id: string;
  name: string;
  number: string;
  imageUrl: string;
  prices: Array<{
    currency: '₹' | '$';
    price: number;
  }>;
  defaultStones: Array<{
    stoneId: string;
    quantity: number;
  }>;
  createdBy: string;
  updatedBy?: string;
  updateHistory: Array<{
    field: string;
    oldValue: string | number | boolean | Date;
    newValue: string | number | boolean | Date;
    updatedBy: string;
    updatedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country: string;
  };
  company?: string;
  gstNumber?: string;
  customerType: 'retail' | 'wholesale' | 'corporate';
  creditLimit: number;
  paymentTerms: 'immediate' | '7days' | '15days' | '30days' | '45days';
  isActive: boolean;
  notes?: string;
  tags: string[];
  createdBy: string;
  updatedBy?: string;
  updateHistory: Array<{
    field: string;
    oldValue: string | number | boolean | Date;
    newValue: string | number | boolean | Date;
    updatedBy: string;
    updatedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DesignOrder {
  _id?: string;
  designId: string | Design;
  stonesUsed: Array<{
    stoneId: string | Stone;
    quantity: number;
  }>;
  otherItemsUsed?: Array<{
    itemType: 'plastic' | 'tape' | 'other';
    itemId: string | Plastic | Tape;
    quantity: number;
    unit?: string;
  }>;
  paperUsed: {
    sizeInInch: number;
    quantityInPcs: number;
    paperWeightPerPc: number;
    customPaperWeight?: number;
  };
  calculatedWeight?: number;
  finalWeight?: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface Order {
  _id: string;
  type: 'internal' | 'out';
  customerName: string;
  phone: string;
  customerId?: string; // Reference to Customer model
  gstNumber?: string;

  // New structure for multiple design orders
  designOrders: DesignOrder[];

  // Legacy fields for backward compatibility
  designId?: string | Design;
  stonesUsed?: Array<{
    stoneId: string | Stone;
    quantity: number;
  }>;
  paperUsed?: {
    sizeInInch: number;
    quantityInPcs: number;
    paperWeightPerPc: number;
    customPaperWeight?: number;
  };

  finalTotalWeight?: number;
  calculatedWeight?: number;
  weightDiscrepancy: number;
  discrepancyPercentage: number;
  stoneUsed?: number;
  status: 'pending' | 'completed' | 'cancelled';
  isFinalized: boolean;
  finalizedAt?: Date;
  modeOfPayment: 'cash' | 'UPI' | 'card';
  paymentStatus: 'pending' | 'partial' | 'completed' | 'overdue';
  discountType: 'percentage' | 'flat';
  discountValue: number;
  totalCost: number;
  discountedAmount: number;
  finalAmount: number;
  notes?: string;
  createdBy: string | User;
  updatedBy?: string | User;
  updateHistory: Array<{
    field: string;
    oldValue: string | number | boolean | Date;
    newValue: string | number | boolean | Date;
    updatedBy: string | User;
    updatedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
