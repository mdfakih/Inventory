import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import Stone from '@/models/Stone';
import Paper from '@/models/Paper';
import Plastic from '@/models/Plastic';
import Tape from '@/models/Tape';

async function generateReport(request: NextRequest) {
  try {
    // Check authentication and authorization
    requireRole(request, ['admin']);

    let type = 'all';
    let startDate = null;
    let endDate = null;

    // Handle both GET and POST requests
    if (request.method === 'GET') {
      const { searchParams } = new URL(request.url);
      type = searchParams.get('type') || 'all';
      startDate = searchParams.get('startDate');
      endDate = searchParams.get('endDate');
    } else if (request.method === 'POST') {
      const body = await request.json();
      type = body.type || 'all';
      startDate = body.dateRange?.startDate;
      endDate = body.dateRange?.endDate;
    }

    await dbConnect();

    // Build date filter
    const dateFilter: Record<string, unknown> = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z'),
      };
    }

    let reportData: Record<string, unknown> = {};

    switch (type) {
      case 'inventory':
        const [stones, papers, plastics, tapes] = await Promise.all([
          Stone.find({}),
          Paper.find({}),
          Plastic.find({}),
          Tape.find({}),
        ]);
        reportData = { stones, papers, plastics, tapes };
        break;

      case 'orders':
        const orders = await Order.find(dateFilter)
          .populate('designId', 'name number')
          .populate('stonesUsed.stoneId', 'name')
          .populate('receivedMaterials.stones.stoneId', 'name')
          .sort({ createdAt: -1 });
        reportData = { orders };
        break;

      case 'users':
        const users = await User.find({})
          .select('-password')
          .sort({ createdAt: -1 });
        reportData = { users };
        break;

      case 'analytics':
        const [analyticsOrders, analyticsStones, analyticsPapers] =
          await Promise.all([
            Order.find(dateFilter)
              .populate('designId', 'name')
              .populate('stonesUsed.stoneId', 'name')
              .populate('receivedMaterials.stones.stoneId', 'name'),
            Stone.find({}),
            Paper.find({}),
          ]);

        // Calculate inventory analytics
        const totalStoneQuantity = analyticsStones.reduce(
          (sum, stone) => sum + stone.quantity,
          0,
        );
        const totalPaperQuantity = analyticsPapers.reduce(
          (sum, paper) => sum + paper.quantity,
          0,
        );
        const lowStockStones = analyticsStones.filter(
          (stone) => stone.quantity < 100,
        );
        const lowStockPapers = analyticsPapers.filter(
          (paper) => paper.quantity < 10,
        );

        // Calculate order analytics
        const completedOrders = analyticsOrders.filter(
          (order) => order.status === 'completed',
        );
        const pendingOrders = analyticsOrders.filter(
          (order) => order.status === 'pending',
        );
        const internalOrders = analyticsOrders.filter(
          (order) => order.type === 'internal',
        );
        const outOrders = analyticsOrders.filter(
          (order) => order.type === 'out',
        );

        // Calculate payment status analytics
        const pendingPayments = analyticsOrders.filter(
          (order) => order.paymentStatus === 'pending',
        );
        const partialPayments = analyticsOrders.filter(
          (order) => order.paymentStatus === 'partial',
        );
        const completedPayments = analyticsOrders.filter(
          (order) => order.paymentStatus === 'completed',
        );
        const overduePayments = analyticsOrders.filter(
          (order) => order.paymentStatus === 'overdue',
        );

        reportData = {
          orders: analyticsOrders,
          stones: analyticsStones,
          papers: analyticsPapers,
          analytics: {
            inventory: {
              totalStoneQuantity,
              totalPaperQuantity,
              lowStockStones: lowStockStones.length,
              lowStockPapers: lowStockPapers.length,
            },
            orders: {
              total: analyticsOrders.length,
              completed: completedOrders.length,
              pending: pendingOrders.length,
              internal: internalOrders.length,
              out: outOrders.length,
              paymentStatus: {
                pending: pendingPayments.length,
                partial: partialPayments.length,
                completed: completedPayments.length,
                overdue: overduePayments.length,
              },
            },
            lowStockItems: [...lowStockStones, ...lowStockPapers],
          },
        };
        break;

      default: // 'all'
        const [
          allOrders,
          allUsers,
          allStones,
          allPapers,
          allPlastics,
          allTapes,
        ] = await Promise.all([
          Order.find(dateFilter)
            .populate('designId', 'name number')
            .populate('stonesUsed.stoneId', 'name')
            .populate('receivedMaterials.stones.stoneId', 'name'),
          User.find({}).select('-password'),
          Stone.find({}),
          Paper.find({}),
          Plastic.find({}),
          Tape.find({}),
        ]);
        reportData = {
          orders: allOrders,
          users: allUsers,
          stones: allStones,
          papers: allPapers,
          plastics: allPlastics,
          tapes: allTapes,
        };
    }

    return NextResponse.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate report' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, message: 'Invalid pagination parameters' },
        { status: 400 },
      );
    }

    const skip = (page - 1) * limit;

    if (type === 'all') {
      // Get all data with pagination
      const [orders, users, stones, papers, plastics, tapes] = await Promise.all([
        Order.find()
          .populate('designId')
          .populate('createdBy', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        User.find()
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Stone.find().sort({ name: 1 }).skip(skip).limit(limit),
        Paper.find().sort({ width: 1 }).skip(skip).limit(limit),
        Plastic.find().sort({ width: 1 }).skip(skip).limit(limit),
        Tape.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      ]);

      // Get total counts
      const [ordersTotal, usersTotal, stonesTotal, papersTotal, plasticsTotal, tapesTotal] = await Promise.all([
        Order.countDocuments(),
        User.countDocuments(),
        Stone.countDocuments(),
        Paper.countDocuments(),
        Plastic.countDocuments(),
        Tape.countDocuments(),
      ]);

      // Calculate analytics
      const totalOrders = await Order.countDocuments();
      const internalOrders = await Order.countDocuments({ type: 'internal' });
      const outOrders = await Order.countDocuments({ type: 'out' });
      const lowStockStones = await Stone.countDocuments({ quantity: { $lt: 5 } });
      const lowStockPapers = await Paper.countDocuments({ quantity: { $lt: 5 } });

      return NextResponse.json({
        success: true,
        data: {
          orders,
          users,
          stones,
          papers,
          plastics,
          tapes,
        },
        pagination: {
          page,
          limit,
          orders: {
            total: ordersTotal,
            pages: Math.ceil(ordersTotal / limit),
          },
          users: {
            total: usersTotal,
            pages: Math.ceil(usersTotal / limit),
          },
          stones: {
            total: stonesTotal,
            pages: Math.ceil(stonesTotal / limit),
          },
          papers: {
            total: papersTotal,
            pages: Math.ceil(papersTotal / limit),
          },
          plastics: {
            total: plasticsTotal,
            pages: Math.ceil(plasticsTotal / limit),
          },
          tapes: {
            total: tapesTotal,
            pages: Math.ceil(tapesTotal / limit),
          },
        },
        analytics: {
          totalOrders,
          internalOrders,
          outOrders,
          lowStockStones,
          lowStockPapers,
        },
      });
    } else {
      // Handle specific type requests with pagination
      let data: Record<string, unknown> = {};
      let pagination: Record<string, { page: number; limit: number; total: number; pages: number }> = {};
      const analytics: Record<string, unknown> = {};

      switch (type) {
        case 'orders':
          const orders = await Order.find()
            .populate('designId')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
          const ordersTotal = await Order.countDocuments();
          
          data.orders = orders;
          pagination.orders = {
            page,
            limit,
            total: ordersTotal,
            pages: Math.ceil(ordersTotal / limit),
          };
          break;

        case 'users':
          const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
          const usersTotal = await User.countDocuments();
          
          data.users = users;
          pagination.users = {
            page,
            limit,
            total: usersTotal,
            pages: Math.ceil(usersTotal / limit),
          };
          break;

        case 'inventory':
          const [stones, papers, plastics, tapes] = await Promise.all([
            Stone.find().sort({ name: 1 }).skip(skip).limit(limit),
            Paper.find().sort({ width: 1 }).skip(skip).limit(limit),
            Plastic.find().sort({ width: 1 }).skip(skip).limit(limit),
            Tape.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
          ]);
          
          const [stonesTotal, papersTotal, plasticsTotal, tapesTotal] = await Promise.all([
            Stone.countDocuments(),
            Paper.countDocuments(),
            Plastic.countDocuments(),
            Tape.countDocuments(),
          ]);
          
          data = { stones, papers, plastics, tapes };
          pagination = {
            stones: { page, limit, total: stonesTotal, pages: Math.ceil(stonesTotal / limit) },
            papers: { page, limit, total: papersTotal, pages: Math.ceil(papersTotal / limit) },
            plastics: { page, limit, total: plasticsTotal, pages: Math.ceil(plasticsTotal / limit) },
            tapes: { page, limit, total: tapesTotal, pages: Math.ceil(tapesTotal / limit) },
          };
          break;

        default:
          return NextResponse.json(
            { success: false, message: 'Invalid report type' },
            { status: 400 },
          );
      }

      return NextResponse.json({
        success: true,
        data,
        pagination,
        analytics,
      });
    }
  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  return generateReport(request);
}
