# Customer Management System

## Overview
The Customer Management System provides comprehensive customer data management, order history tracking, and analytics for the inventory management system. It allows users to create, update, and manage customer information while maintaining a complete audit trail of all changes.

## Features

### 1. Customer Management
- **Create New Customers**: Add customers with comprehensive information including contact details, address, company information, and preferences
- **Update Customer Details**: Modify existing customer information with change tracking
- **Customer Search**: Advanced search functionality with filters for customer type, status, and text search
- **Soft Delete**: Deactivate customers instead of permanent deletion to maintain data integrity

### 2. Customer Information Fields
- **Basic Details**: Name, phone, email
- **Company Information**: Company name, GST number
- **Address**: Street, city, state, pincode, country
- **Business Details**: Customer type (retail/wholesale/corporate), credit limit, payment terms
- **Metadata**: Notes, tags, status, creation/update history

### 3. Order Integration
- **Customer Autocomplete**: Search and select existing customers when creating orders
- **Automatic Customer Creation**: Create new customers automatically when placing orders with new customer details
- **Customer Updates**: Update existing customer information when order details differ
- **Order History**: Track all orders associated with each customer

### 4. Analytics & Reporting
- **Customer Analytics**: Total customers, new customers, customer type distribution
- **Individual Customer Analytics**: Order count, total spent, average order value, completion rate
- **Order History**: Complete order tracking with status, payment, and design preferences
- **Performance Metrics**: Payment statistics, design preferences, and customer behavior patterns

## API Endpoints

### Customer Management
- `GET /api/customers` - List customers with search, filters, and pagination
- `POST /api/customers` - Create new customer
- `GET /api/customers/[id]` - Get customer details
- `PUT /api/customers/[id]` - Update customer information
- `DELETE /api/customers/[id]` - Deactivate customer (soft delete)

### Customer Search
- `GET /api/customers/search` - Search customers for autocomplete functionality
- `POST /api/customers/find-or-create` - Find existing customer or create new one

### Analytics
- `GET /api/customers/analytics` - Get customer analytics (general or specific customer)

## Database Schema

### Customer Model
```typescript
interface Customer {
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
    oldValue: any;
    newValue: any;
    updatedBy: string;
    updatedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

### Order Model Updates
- Added `customerId` field to reference Customer model
- Added `notes` field for order-specific notes

## Components

### 1. CustomerAutocomplete Component
- **Location**: `src/components/customer-autocomplete.tsx`
- **Purpose**: Provides autocomplete functionality for customer selection in order forms
- **Features**: 
  - Real-time search as user types
  - Customer selection with detailed preview
  - Clear selection functionality
  - Customer type indicators and badges

### 2. Customers Page
- **Location**: `src/app/customers/page.tsx`
- **Purpose**: Main customer management interface
- **Features**:
  - Customer listing with search and filters
  - Create, edit, and view customer dialogs
  - Analytics dashboard
  - Pagination and bulk operations

### 3. Customer Details Page
- **Location**: `src/app/customers/[id]/page.tsx`
- **Purpose**: Detailed view of individual customer information
- **Features**:
  - Complete customer profile
  - Order history and analytics
  - Customer performance metrics
  - Address and contact information

## Usage Examples

### 1. Creating a New Customer
```typescript
const customerData = {
  name: "John Doe",
  phone: "+91-9876543210",
  email: "john@example.com",
  company: "ABC Company",
  customerType: "corporate",
  address: {
    street: "123 Main Street",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    country: "India"
  }
};

const response = await authenticatedFetch('/api/customers', {
  method: 'POST',
  body: JSON.stringify(customerData)
});
```

### 2. Searching Customers
```typescript
// Search with filters
const response = await authenticatedFetch('/api/customers?search=john&customerType=corporate&page=1&limit=10');
```

### 3. Using Customer Autocomplete in Orders
```typescript
import { CustomerAutocomplete } from '@/components/customer-autocomplete';

<CustomerAutocomplete
  value={customerName}
  onChange={setCustomerName}
  onCustomerSelect={(customer) => {
    // Handle customer selection
    setCustomerPhone(customer.phone);
    setCustomerEmail(customer.email);
  }}
  placeholder="Search customers..."
/>
```

### 4. Finding or Creating Customer During Order
```typescript
const response = await authenticatedFetch('/api/customers/find-or-create', {
  method: 'POST',
  body: JSON.stringify({
    name: customerName,
    phone: customerPhone,
    email: customerEmail
  })
});

if (response.success) {
  const customer = response.data;
  // Use customer._id for order creation
}
```

## Security Features

### 1. Authentication & Authorization
- All API endpoints require valid authentication
- User session validation for all operations
- Role-based access control (admin/manager/employee)

### 2. Data Validation
- Input sanitization and validation
- Phone number uniqueness enforcement
- Required field validation
- Data type and format validation

### 3. Audit Trail
- Complete change history tracking
- User attribution for all modifications
- Timestamp recording for all operations

## Performance Optimizations

### 1. Database Indexing
- Text search indexes on name, phone, email, and company
- Compound indexes for efficient queries
- Unique constraints for phone numbers

### 2. Pagination
- Server-side pagination for large customer lists
- Configurable page sizes
- Efficient database queries with skip/limit

### 3. Caching
- Client-side caching for frequently accessed data
- Optimized API responses
- Efficient state management

## Error Handling

### 1. API Error Responses
- Consistent error message format
- HTTP status codes for different error types
- Detailed error logging for debugging

### 2. User Experience
- User-friendly error messages
- Loading states and progress indicators
- Graceful fallbacks for failed operations

## Future Enhancements

### 1. Advanced Analytics
- Customer lifetime value calculations
- Predictive analytics for customer behavior
- Custom reporting and dashboards

### 2. Integration Features
- CRM system integration
- Email marketing integration
- Customer communication tools

### 3. Mobile Support
- Responsive design improvements
- Mobile app integration
- Offline capability

## Troubleshooting

### Common Issues

1. **Customer Search Not Working**
   - Check if text index is created on Customer collection
   - Verify search query length (minimum 2 characters)
   - Check database connection

2. **Customer Creation Fails**
   - Verify phone number uniqueness
   - Check required field validation
   - Ensure user authentication

3. **Analytics Not Loading**
   - Check customer ID parameter
   - Verify order data exists
   - Check database aggregation pipeline

### Debug Mode
Enable debug logging by setting environment variable:
```bash
DEBUG_CUSTOMER_API=true
```

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.
