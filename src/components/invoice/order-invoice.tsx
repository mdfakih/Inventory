'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { authenticatedFetch } from '@/lib/utils';
import { Download, Printer, X } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Image from 'next/image';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Design {
  _id: string;
  name: string;
  number: string;
  imageUrl: string;
  prices: Array<{
    currency: '₹' | '$';
    price: number;
  }>;
}

interface Stone {
  _id: string;
  name: string;
  color: string;
  size: string;
}

interface DesignOrder {
  designId: Design;
  quantity: number;
  stonesUsed: Array<{
    stoneId: Stone;
    quantity: number;
  }>;
  paperUsed: {
    sizeInInch: number;
    quantityInPcs: number;
    paperWeightPerPc: number;
  };
  calculatedWeight: number;
  unitPrice: number;
  totalPrice: number;
}

interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  gstNumber?: string;
  customerType: 'retail' | 'wholesale' | 'corporate';
}

interface Order {
  _id: string;
  type: 'internal' | 'out';
  customerName: string;
  phone: string;
  customerId?: Customer;
  gstNumber?: string;
  designOrders: DesignOrder[];
  calculatedWeight?: number;
  finalTotalWeight?: number;
  weightDiscrepancy: number;
  discrepancyPercentage: number;
  status: 'pending' | 'completed' | 'cancelled';
  isFinalized: boolean;
  finalizedAt?: string;
  modeOfPayment: 'cash' | 'UPI' | 'card';
  paymentStatus: 'pending' | 'partial' | 'completed' | 'overdue';
  discountType: 'percentage' | 'flat';
  discountValue: number;
  totalCost: number;
  discountedAmount: number;
  finalAmount: number;
  notes?: string;
  createdBy: User;
  updatedBy?: User;
  createdAt: string;
  updatedAt: string;
}

interface OrderInvoiceProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderInvoice({ orderId, isOpen, onClose }: OrderInvoiceProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const fetchOrderData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(`/api/orders/${orderId}/invoice`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOrder(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching order data:', error);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderData();
    }
  }, [isOpen, orderId, fetchOrderData]);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle click outside modal
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const generatePDF = async () => {
    if (!order) return;
    
    setGeneratingPDF(true);
    try {
      const element = document.getElementById('invoice-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`invoice-${order._id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const printInvoice = () => {
    const element = document.getElementById('invoice-content');
    if (element) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice - ${order?.customerName}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .invoice-header { text-align: center; margin-bottom: 30px; }
                .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
                .customer-info, .order-info { flex: 1; }
                .designs-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .designs-table th, .designs-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                .designs-table th { background-color: #f8f9fa; }
                .design-image { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; }
                .totals { margin-top: 30px; text-align: right; }
                .total-row { margin: 10px 0; }
                .final-amount { font-size: 18px; font-weight: bold; color: #2563eb; }
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>
              ${element.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 flex flex-col items-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading invoice...</p>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 flex flex-col items-center">
          <p className="text-red-600">Failed to load order data</p>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button - positioned absolutely in top-right corner */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 group"
          aria-label="Close invoice"
        >
          <X className="h-5 w-5 text-gray-600 group-hover:text-gray-800" />
        </button>

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Invoice</h2>
          <div className="flex gap-2">
            <Button
              onClick={generatePDF}
              disabled={generatingPDF}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              {generatingPDF ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button onClick={printInvoice} variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Invoice Content */}
        <div id="invoice-content" className="p-6">
          {/* Company Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">INVENTORY MANAGEMENT</h1>
            <p className="text-gray-600">Professional Design & Manufacturing Services</p>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Bill To:</h3>
              <div className="space-y-1">
                <p className="font-medium">{order.customerName}</p>
                <p className="text-gray-600">{order.phone}</p>
                {order.customerId?.email && (
                  <p className="text-gray-600">{order.customerId.email}</p>
                )}
                {order.customerId?.company && (
                  <p className="text-gray-600">{order.customerId.company}</p>
                )}
                {order.gstNumber && (
                  <p className="text-gray-600">GST: {order.gstNumber}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Invoice Details:</h3>
              <div className="space-y-1">
                <p className="text-gray-600">
                  <span className="font-medium">Invoice #:</span> {order._id.slice(-8).toUpperCase()}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Date:</span> {new Date(order.createdAt).toLocaleDateString()}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Order Type:</span>{' '}
                  <Badge variant={order.type === 'internal' ? 'default' : 'secondary'}>
                    {order.type}
                  </Badge>
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Status:</span>{' '}
                  <Badge className={
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }>
                    {order.status}
                  </Badge>
                </p>
              </div>
            </div>
          </div>

          {/* Designs Table */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Order Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-3 text-left">Design</th>
                    <th className="border border-gray-300 p-3 text-left">Image</th>
                    <th className="border border-gray-300 p-3 text-center">Quantity</th>
                    <th className="border border-gray-300 p-3 text-center">Paper Size</th>
                    <th className="border border-gray-300 p-3 text-center">Unit Price</th>
                    <th className="border border-gray-300 p-3 text-center">Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {order.designOrders.map((designOrder, index) => (
                    <tr key={index} className="border-b border-gray-300">
                      <td className="border border-gray-300 p-3">
                        <div>
                          <p className="font-medium">{designOrder.designId.name}</p>
                          <p className="text-sm text-gray-600">#{designOrder.designId.number}</p>
                        </div>
                      </td>
                      <td className="border border-gray-300 p-3">
                        <Image
                          src={designOrder.designId.imageUrl}
                          alt={designOrder.designId.name}
                          width={64}
                          height={64}
                          className="object-cover rounded border"
                        />
                      </td>
                      <td className="border border-gray-300 p-3 text-center">
                        {designOrder.quantity} pcs
                      </td>
                      <td className="border border-gray-300 p-3 text-center">
                        {designOrder.paperUsed.sizeInInch}&quot; × {designOrder.paperUsed.quantityInPcs} pcs
                      </td>
                      <td className="border border-gray-300 p-3 text-center">
                        ₹{designOrder.unitPrice?.toFixed(2) || '0.00'}
                      </td>
                      <td className="border border-gray-300 p-3 text-center font-medium">
                        ₹{designOrder.totalPrice?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stones Used */}
          {order.designOrders.some(designOrder => designOrder.stonesUsed && designOrder.stonesUsed.length > 0) && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Stones Used</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-3 text-left">Stone</th>
                      <th className="border border-gray-300 p-3 text-center">Color</th>
                      <th className="border border-gray-300 p-3 text-center">Size</th>
                      <th className="border border-gray-300 p-3 text-center">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.designOrders.map(designOrder => 
                      designOrder.stonesUsed?.map((stone, stoneIndex) => (
                        <tr key={`${designOrder.designId._id}-${stoneIndex}`} className="border-b border-gray-300">
                          <td className="border border-gray-300 p-3">{stone.stoneId.name}</td>
                          <td className="border border-gray-300 p-3 text-center">{stone.stoneId.color}</td>
                          <td className="border border-gray-300 p-3 text-center">{stone.stoneId.size}</td>
                          <td className="border border-gray-300 p-3 text-center">{stone.quantity}g</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Weight Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Calculated Weight</p>
              <p className="text-lg font-semibold">{order.calculatedWeight?.toFixed(2)}g</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Final Weight</p>
              <p className="text-lg font-semibold">
                {order.finalTotalWeight ? `${order.finalTotalWeight.toFixed(2)}g` : 'Not set'}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Payment Status</p>
              <Badge className={
                order.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                order.paymentStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                order.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }>
                {order.paymentStatus}
              </Badge>
            </div>
          </div>

          {/* Payment Details */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Mode of Payment:</span>{' '}
                  <Badge variant="outline" className="capitalize">
                    {order.modeOfPayment}
                  </Badge>
                </p>
                {order.notes && (
                  <div>
                    <p className="font-medium text-gray-800 mb-1">Notes:</p>
                    <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">
                      {order.notes}
                    </p>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₹{order.totalCost?.toFixed(2) || '0.00'}</span>
                  </div>
                  {order.discountValue > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Discount ({order.discountType === 'percentage' ? `${order.discountValue}%` : 'Flat'}):
                      </span>
                      <span className="text-green-600 font-medium">
                        -₹{order.discountedAmount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">Total Amount:</span>
                      <span className="text-xl font-bold text-blue-600">
                        ₹{order.finalAmount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-600 text-sm border-t pt-6">
            <p>Thank you for your business!</p>
            <p className="mt-2">
              Created by: {order.createdBy?.name} | 
              Date: {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
