# Inventory Management System - Project Structure

```
inventory-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts
│   │   │   │   └── logout/
│   │   │   │       └── route.ts
│   │   │   ├── inventory/
│   │   │   │   ├── stones/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── paper/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── plastic/
│   │   │   │   │   └── route.ts
│   │   │   │   └── tape/
│   │   │   │       └── route.ts
│   │   │   ├── designs/
│   │   │   │   └── route.ts
│   │   │   └── orders/
│   │   │       └── route.ts
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── inventory/
│   │   │   └── page.tsx
│   │   ├── designs/
│   │   │   └── page.tsx
│   │   ├── orders/
│   │   │   └── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── form.tsx
│   │   │   ├── label.tsx
│   │   │   ├── table.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── select.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── sheet.tsx
│   │   │   └── dialog.tsx
│   │   ├── auth/
│   │   │   └── login-form.tsx
│   │   ├── dashboard/
│   │   │   ├── admin-dashboard.tsx
│   │   │   ├── manager-dashboard.tsx
│   │   │   └── employee-dashboard.tsx
│   │   ├── inventory/
│   │   │   ├── stones-table.tsx
│   │   │   ├── paper-table.tsx
│   │   │   ├── plastic-table.tsx
│   │   │   └── tape-table.tsx
│   │   ├── designs/
│   │   │   ├── designs-table.tsx
│   │   │   └── design-form.tsx
│   │   └── orders/
│   │       ├── orders-table.tsx
│   │       └── order-form.tsx
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   └── jwt.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Stone.ts
│   │   ├── Paper.ts
│   │   ├── Plastic.ts
│   │   ├── Tape.ts
│   │   ├── Design.ts
│   │   └── Order.ts
│   └── types/
│       └── index.ts
├── middleware.ts
├── .env.local
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

## Key Features:

1. **Authentication & Authorization**

   - JWT-based authentication with HttpOnly cookies
   - Role-based access control (Admin, Manager, Employee)
   - Middleware for route protection

2. **Inventory Management**

   - Stones (name, number, color, size, quantity, unit)
   - Role Paper (widths: 9, 13, 16, 19, 20, 24 inches)
   - Packaging Plastic (widths: 12, 14, 16, 18, 20 inches)
   - Cello Tape

3. **Design Management**

   - Design master with image upload
   - Default stones configuration

4. **Order Management**

   - Internal and external orders
   - Automatic inventory calculation
   - Customer information tracking

5. **Analytics Dashboard**

   - Stock visualization with Recharts
   - Order statistics
   - Consumption analytics

6. **UI Components**
   - TailwindCSS styling
   - shadcn/ui components
   - Responsive design
