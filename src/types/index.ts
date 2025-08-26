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
  width: 9 | 13 | 16 | 19 | 20 | 24;
  quantity: number;
  totalPieces: number;
  unit: 'pcs';
  piecesPerRoll: number;
  weightPerPiece: number;
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

export interface Order {
  _id: string;
  type: 'internal' | 'out';
  customerName: string;
  phone: string;
  customerId?: string; // Reference to Customer model
  designId: string;
  stonesUsed: Array<{
    stoneId: string;
    quantity: number;
  }>;
  paperUsed: {
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
