'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { authenticatedFetch } from '@/lib/utils';
import { Order } from '@/types';
import { Package, Calendar, DollarSign, Scale } from 'lucide-react';

interface CustomerOrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
}

export function CustomerOrderHistoryModal({
  isOpen,
  onClose,
  customerId,
  customerName,
}: CustomerOrderHistoryModalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrderHistory = async () => {
    if (!customerId) return;

    try {
      setLoading(true);
      const response = await authenticatedFetch(
        `/api/customers/analytics?customerId=${customerId}`,
      );
      const result = await response.json();
      if (result.success) {
        setOrders(result.data.analytics.recentOrders || []);
      }
    } catch (error) {
      console.error('Failed to fetch order history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && customerId) {
      fetchOrderHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, customerId]);

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <DialogContent className="w-[95vw] sm:w-[75vw] max-w-[1000px] h-[85vh] sm:h-[75vh] max-h-[800px] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <Package className="h-6 w-6" />
            Order History - {customerName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No orders found</p>
            <p className="text-sm">
              This customer hasn&apos;t placed any orders yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={getOrderStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                    <Badge
                      className={getPaymentStatusColor(
                        order.paymentStatus || 'pending',
                      )}
                    >
                      {order.paymentStatus || 'pending'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <Label className="text-xs font-medium text-gray-600">
                      Order ID
                    </Label>
                    <p className="font-mono text-sm">{order._id.slice(-8)}</p>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-600">
                      Type
                    </Label>
                    <p className="capitalize text-sm">{order.type}</p>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Amount
                    </Label>
                    <p className="font-semibold text-sm">
                      {formatCurrency(order.finalAmount || 0)}
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <Scale className="h-3 w-3" />
                      Weight
                    </Label>
                    <p className="text-sm">
                      {order.finalTotalWeight
                        ? `${order.finalTotalWeight}g`
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {order.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <Label className="text-xs font-medium text-gray-600">
                      Notes
                    </Label>
                    <p className="text-sm text-gray-700">{order.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
