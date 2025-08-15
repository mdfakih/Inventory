import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import Stone from '@/models/Stone';
import Paper from '@/models/Paper';
import Plastic from '@/models/Plastic';
import Tape from '@/models/Tape';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const user = requireRole(request, ['admin']);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    await dbConnect();

    // Build date filter
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z')
      };
    }

    let reportData: any = {};

    switch (type) {
      case 'inventory':
        const [stones, papers, plastics, tapes] = await Promise.all([
          Stone.find({}),
          Paper.find({}),
          Plastic.find({}),
          Tape.find({})
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
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        reportData = { users };
        break;

      case 'analytics':
        const [analyticsOrders, analyticsStones, analyticsPapers] = await Promise.all([
          Order.find(dateFilter).populate('designId', 'name'),
          Stone.find({}),
          Paper.find({})
        ]);
        reportData = { orders: analyticsOrders, stones: analyticsStones, papers: analyticsPapers };
        break;

      default: // 'all'
        const [allOrders, allUsers, allStones, allPapers, allPlastics, allTapes] = await Promise.all([
          Order.find(dateFilter).populate('designId', 'name number').populate('stonesUsed.stoneId', 'name'),
          User.find({}).select('-password'),
          Stone.find({}),
          Paper.find({}),
          Plastic.find({}),
          Tape.find({})
        ]);
        reportData = { orders: allOrders, users: allUsers, stones: allStones, papers: allPapers, plastics: allPlastics, tapes: allTapes };
    }

    return NextResponse.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
