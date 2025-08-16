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
    requireRole(request, ['admin']);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const format = searchParams.get('format') || 'csv';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    await dbConnect();

    // Build date filter
    const dateFilter: Record<string, unknown> = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z')
      };
    }

    let data: Record<string, unknown>[] = [];
    let headers: string[] = [];

    switch (type) {
      case 'inventory':
        const [stones, papers, plastics, tapes] = await Promise.all([
          Stone.find({}),
          Paper.find({}),
          Plastic.find({}),
          Tape.find({})
        ]);
        
        // Combine all inventory data
        data = [
          ...stones.map((stone: { name: string; number: string; color: string; size: string; quantity: number; unit: string }) => ({
            type: 'Stone',
            name: stone.name,
            number: stone.number,
            color: stone.color,
            size: stone.size,
            quantity: stone.quantity,
            unit: stone.unit
          })),
          ...papers.map((paper: { width: number; quantity: number; piecesPerRoll: number }) => ({
            type: 'Paper',
            width: `${paper.width}"`,
            quantity: paper.quantity,
            piecesPerRoll: paper.piecesPerRoll,
            totalPieces: paper.quantity * paper.piecesPerRoll
          })),
          ...plastics.map((plastic: { width: number; quantity: number }) => ({
            type: 'Plastic',
            width: `${plastic.width}"`,
            quantity: plastic.quantity
          })),
          ...tapes.map((tape: { quantity: number }) => ({
            type: 'Tape',
            quantity: tape.quantity
          }))
        ];
        headers = ['Type', 'Name/Width', 'Number', 'Color', 'Size', 'Quantity', 'Unit', 'Pieces per Roll', 'Total Pieces'];
        break;

      case 'orders':
        const orders = await Order.find(dateFilter)
          .populate('designId', 'name number')
          .populate('stonesUsed.stoneId', 'name')
          .sort({ createdAt: -1 });
        
        data = orders.map((order: { _id: string; type: string; customerName: string; phone: string; designId: { name: string }; finalTotalWeight: number; createdAt: Date; stonesUsed: Array<{ stoneId: { name: string }; quantity: number }> }) => ({
          orderId: order._id.toString().slice(-6),
          type: order.type,
          customerName: order.customerName,
          phone: order.phone,
          design: order.designId?.name || 'N/A',
          totalWeight: order.finalTotalWeight,
          date: new Date(order.createdAt).toLocaleDateString(),
          stonesUsed: order.stonesUsed.map((s: { stoneId: { name: string }; quantity: number }) => `${s.stoneId?.name} (${s.quantity})`).join(', ')
        }));
        headers = ['Order ID', 'Type', 'Customer', 'Phone', 'Design', 'Total Weight (kg)', 'Date', 'Stones Used'];
        break;

      case 'users':
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        
        data = users.map((user: { name: string; email: string; role: string; createdAt: Date }) => ({
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: new Date(user.createdAt).toLocaleDateString()
        }));
        headers = ['Name', 'Email', 'Role', 'Created Date'];
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
        
        // Create summary data
        data = [
          {
            category: 'Orders',
            total: allOrders.length,
            internal: allOrders.filter((o: { type: string }) => o.type === 'internal').length,
            external: allOrders.filter((o: { type: string }) => o.type === 'out').length,
            totalWeight: allOrders.reduce((sum: number, o: { finalTotalWeight: number }) => sum + (o.finalTotalWeight || 0), 0)
          },
          {
            category: 'Users',
            total: allUsers.length,
            admin: allUsers.filter((u: { role: string }) => u.role === 'admin').length,
            manager: allUsers.filter((u: { role: string }) => u.role === 'manager').length,
            employee: allUsers.filter((u: { role: string }) => u.role === 'employee').length
          },
          {
            category: 'Inventory',
            stoneTypes: allStones.length,
            paperTypes: allPapers.length,
            plasticTypes: allPlastics.length,
            tapeTypes: allTapes.length
          }
        ];
        headers = ['Category', 'Total', 'Internal/Admin', 'External/Manager', 'Total Weight/Employee', 'Stone Types', 'Paper Types', 'Plastic Types', 'Tape Types'];
    }

    let content = '';
    let contentType = '';

    switch (format) {
      case 'csv':
        content = generateCSV(data, headers);
        contentType = 'text/csv';
        break;
      case 'excel':
        content = generateCSV(data, headers); // Simplified Excel export as CSV
        contentType = 'application/vnd.ms-excel';
        break;
      default:
        content = generateCSV(data, headers);
        contentType = 'text/csv';
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="report-${type}-${new Date().toISOString().split('T')[0]}.${format}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting report:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to export report' },
      { status: 500 }
    );
  }
}

function generateCSV(data: Record<string, unknown>[], headers: string[]): string {
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header.toLowerCase().replace(/\s+/g, '')] || row[header] || '';
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}
