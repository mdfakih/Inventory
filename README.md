# Inventory Management System

A full-stack inventory and order management system built with Next.js 14, MongoDB, and TypeScript.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication with HttpOnly cookies
- Role-based access control (Admin, Manager, Employee)
- Middleware for route protection

### 📦 Inventory Management
- **Stones**: Name, number, color, size, quantity, unit (g/kg)
- **Role Paper**: Widths 9, 13, 16, 19, 20, 24 inches with pieces per roll
- **Packaging Plastic**: Widths 12, 14, 16, 18, 20 inches
- **Cello Tape**: Quantity tracking

### 🎨 Design Management
- Design master with image upload
- Default stones configuration
- Design number tracking

### 📋 Order Management
- Internal and external orders
- Automatic inventory calculation
- Customer information tracking
- Stone usage calculation

### 📊 Analytics Dashboard
- Stock visualization with Recharts
- Order statistics
- Consumption analytics
- Role-based dashboard views

### 🎨 UI Components
- TailwindCSS styling
- shadcn/ui components
- Responsive design

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Express-like handlers
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with HttpOnly cookies
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Styling**: TailwindCSS

## Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd inventory-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/inventory-app
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NEXTAUTH_SECRET=your-nextauth-secret-key
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Setup

The application will automatically create the necessary collections when you first use it. However, you may want to create some initial data:

### Create Admin User
You can create an admin user by making a POST request to `/api/auth/register` (you'll need to implement this) or directly in MongoDB:

```javascript
// In MongoDB shell or MongoDB Compass
use inventory-app
db.users.insertOne({
  email: "admin@example.com",
  password: "$2a$12$...", // bcrypt hashed password
  role: "admin",
  name: "Admin User",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## Project Structure

```
inventory-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Dashboard page
│   │   ├── inventory/         # Inventory management
│   │   ├── designs/           # Design management
│   │   ├── orders/            # Order management
│   │   └── login/             # Login page
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── auth/             # Authentication components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── inventory/        # Inventory components
│   │   ├── designs/          # Design components
│   │   └── orders/           # Order components
│   ├── lib/                  # Utility functions
│   ├── models/               # Mongoose models
│   └── types/                # TypeScript types
├── middleware.ts             # Route protection
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Inventory
- `GET /api/inventory/stones` - Get all stones
- `POST /api/inventory/stones` - Create stone
- `GET /api/inventory/paper` - Get all paper
- `POST /api/inventory/paper` - Create paper
- `GET /api/inventory/plastic` - Get all plastic
- `POST /api/inventory/plastic` - Create plastic
- `GET /api/inventory/tape` - Get all tape
- `POST /api/inventory/tape` - Create tape

### Designs
- `GET /api/designs` - Get all designs
- `POST /api/designs` - Create design

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order

## Role-Based Access

### Admin
- Full access to all features
- Analytics dashboard with charts
- User management (if implemented)

### Manager
- CRUD operations for inventory and orders
- No analytics access
- No user management

### Employee
- Read-only access to inventory and orders
- No modification permissions

## Usage

1. **Login**: Use the login page to authenticate
2. **Dashboard**: View role-specific dashboard
3. **Inventory**: Manage stones, paper, plastic, and tape
4. **Designs**: Create and manage design masters
5. **Orders**: Create internal and external orders

## Development

### Adding New Features
1. Create API routes in `src/app/api/`
2. Add Mongoose models in `src/models/`
3. Create React components in `src/components/`
4. Add TypeScript types in `src/types/`

### Styling
- Use TailwindCSS classes
- Leverage shadcn/ui components
- Follow the existing design patterns

### Database Changes
- Update Mongoose models
- Add migration scripts if needed
- Update TypeScript types

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Other Platforms
1. Build the application: `npm run build`
2. Start production server: `npm start`
3. Set up MongoDB connection
4. Configure environment variables

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `NEXTAUTH_SECRET` | NextAuth secret key | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository or contact the development team.
