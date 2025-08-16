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
            Order.find(dateFilter).populate('designId', 'name'),
            Stone.find({}),
            Paper.find({}),
          ]);
        reportData = {
          orders: analyticsOrders,
          stones: analyticsStones,
          papers: analyticsPapers,
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
            .populate('stonesUsed.stoneId', 'name'),
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
  return generateReport(request);
}

export async function POST(request: NextRequest) {
  return generateReport(request);
}
