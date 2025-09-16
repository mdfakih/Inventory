import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Customer from '@/models/Customer';
import Order from '@/models/Order';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getCurrentUser(request);
    if (!user?._id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const period = searchParams.get('period') || '30'; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    if (customerId) {
      // Get analytics for specific customer
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return NextResponse.json(
          { success: false, message: 'Customer not found' },
          { status: 404 },
        );
      }

      // Get customer's order history
      const orders = await Order.find({
        $or: [
          { customerId: customerId },
          {
            $and: [{ customerName: customer.name }, { phone: customer.phone }],
          },
        ],
        createdAt: { $gte: startDate },
      }).sort({ createdAt: -1 });

      // Calculate analytics
      const totalOrders = orders.length;
      const totalAmount = orders.reduce(
        (sum, order) => sum + (order.finalAmount || 0),
        0,
      );
      const averageOrderValue = totalOrders > 0 ? totalAmount / totalOrders : 0;
      const completedOrders = orders.filter(
        (order) => order.status === 'completed',
      ).length;
      const pendingOrders = orders.filter(
        (order) => order.status === 'pending',
      ).length;

      // Payment analytics
      const paymentStats = orders.reduce((stats, order) => {
        const status = order.paymentStatus || 'pending';
        stats[status] = (stats[status] || 0) + 1;
        return stats;
      }, {} as Record<string, number>);

      // Design preferences
      const designStats = orders.reduce((stats, order) => {
        if (order.designId) {
          const designId =
            typeof order.designId === 'string'
              ? order.designId
              : order.designId._id.toString();
          stats[designId] = (stats[designId] || 0) + 1;
        }
        return stats;
      }, {} as Record<string, number>);

      return NextResponse.json({
        success: true,
        data: {
          customer,
          analytics: {
            totalOrders,
            totalAmount,
            averageOrderValue,
            completedOrders,
            pendingOrders,
            completionRate:
              totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
            paymentStats,
            designStats,
            recentOrders: orders.slice(0, 10),
          },
        },
      });
    } else {
      // Get general customer analytics
      const totalCustomers = await Customer.countDocuments({ isActive: true });
      const newCustomersThisPeriod = await Customer.countDocuments({
        isActive: true,
        createdAt: { $gte: startDate },
      });

      // Customer type distribution
      const customerTypeStats = await Customer.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$customerType', count: { $sum: 1 } } },
      ]);

      // Top customers by order count
      const topCustomers = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              customerName: '$customerName',
              phone: '$phone',
            },
            orderCount: { $sum: 1 },
            totalAmount: { $sum: '$finalAmount' },
          },
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 10 },
      ]);

      return NextResponse.json({
        success: true,
        data: {
          totalCustomers,
          newCustomersThisPeriod,
          customerTypeStats,
          topCustomers,
        },
      });
    }
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch customer analytics' },
      { status: 500 },
    );
  }
}
