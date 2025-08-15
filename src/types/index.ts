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
  createdAt: Date;
  updatedAt: Date;
}

export interface Paper {
  _id: string;
  width: 9 | 13 | 16 | 19 | 20 | 24;
  quantity: number;
  unit: 'pcs';
  piecesPerRoll: number;
  weightPerPiece: number;
  updatedBy?: string;
  updateHistory: Array<{
    field: string;
    oldValue: any;
    newValue: any;
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
  paperConfigurations: Array<{
    paperSize: 9 | 13 | 16 | 19 | 20 | 24;
    defaultStones: Array<{
      stoneId: string;
      quantity: number;
    }>;
  }>;
  defaultStones: Array<{
    stoneId: string;
    quantity: number;
  }>;
  createdBy: string;
  updatedBy?: string;
  updateHistory: Array<{
    field: string;
    oldValue: any;
    newValue: any;
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
  createdBy: string;
  updatedBy?: string;
  updateHistory: Array<{
    field: string;
    oldValue: any;
    newValue: any;
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

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
