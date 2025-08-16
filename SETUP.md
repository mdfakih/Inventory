# Inventory App Setup Guide

## Prerequisites

1. **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
2. **MongoDB** - Install locally or use MongoDB Atlas (cloud)
3. **Git** - For cloning the repository

## Quick Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd inventory-app
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

```env
MONGODB_URI=mongodb://localhost:27017/inventory-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=http://localhost:3000
```

**Note:** 
- For local MongoDB: Use `mongodb://localhost:27017/inventory-app`
- For MongoDB Atlas: Use your connection string from Atlas dashboard
- Change the JWT_SECRET to a secure random string in production

### 3. Database Setup

Run the setup script to create sample data:

```bash
npm run setup
```

This will create:
- Admin user: `admin@example.com` / `admin123`
- Manager user: `manager@example.com` / `admin123`
- Employee user: `employee@example.com` / `admin123`
- Sample inventory items (stones, paper, plastic, tape)
- Sample designs

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## MongoDB Setup

### Local MongoDB

1. **Install MongoDB Community Edition:**
   - Windows: Download from [mongodb.com](https://www.mongodb.com/try/download/community)
   - macOS: `brew install mongodb-community`
   - Linux: Follow [official guide](https://docs.mongodb.com/manual/installation/)

2. **Start MongoDB service:**
   - Windows: MongoDB runs as a service automatically
   - macOS: `brew services start mongodb-community`
   - Linux: `sudo systemctl start mongod`

### MongoDB Atlas (Cloud)

1. Create account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a new cluster (free tier available)
3. Get your connection string
4. Replace `MONGODB_URI` in `.env.local` with your Atlas connection string

## Troubleshooting

### Common Issues

1. **"Database configuration error"**
   - Check if `.env.local` file exists
   - Verify `MONGODB_URI` is set correctly
   - Ensure MongoDB is running

2. **"Database connection failed"**
   - Check if MongoDB service is running
   - Verify connection string format
   - Check firewall settings

3. **"Unauthorized" errors**
   - Run `npm run setup` to create users
   - Use correct login credentials
   - Check JWT_SECRET is set

4. **Port 3000 already in use**
   - Kill existing process: `npx kill-port 3000`
   - Or use different port: `npm run dev -- -p 3001`

### Development Tips

1. **Reset Database:**
   ```bash
   npm run setup
   ```

2. **View Logs:**
   - Check browser console for frontend errors
   - Check terminal for backend errors

3. **Environment Variables:**
   - Never commit `.env.local` to git
   - Use different values for production

## Production Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Other Platforms

1. Build: `npm run build`
2. Start: `npm start`
3. Set environment variables
4. Configure MongoDB connection

## Features Overview

### Inventory Management
- **Internal Inventory**: Company-owned materials
- **Out Job Inventory**: Customer-provided materials
- **Stones**: Track by name, number, color, size, quantity
- **Paper**: Track by width, quantity, weight per piece
- **Plastic**: Packaging materials
- **Tape**: Cello tape inventory

### Order Management
- **Internal Orders**: Using company materials
- **Out Orders**: Using customer materials
- **Weight Calculation**: Automatic paper + stone weight
- **Material Tracking**: Consumption and balance

### User Roles
- **Admin**: Full access, analytics, user management
- **Manager**: CRUD operations, no analytics
- **Employee**: Read-only access

## Support

For issues or questions:
1. Check this setup guide
2. Review browser console errors
3. Check terminal logs
4. Create an issue in the repository
