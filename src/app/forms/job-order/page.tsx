'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function JobOrderFormPage() {
  const router = useRouter();
  const [currentDate] = useState(new Date().toLocaleDateString());

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block text-center py-4 border-b-2 border-gray-300">
        <h1 className="text-2xl font-bold text-gray-800">JOB ORDER FORM</h1>
        <p className="text-sm text-gray-600">Inventory Management System</p>
      </div>

      {/* Screen Header - Hidden when printing */}
      <div className="print:hidden bg-white border-b p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Forms</span>
          </Button>
          <Button onClick={handlePrint} className="flex items-center space-x-2">
            <Printer className="h-4 w-4" />
            <span>Print Form</span>
          </Button>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto p-6 print:p-0 print:max-w-none">
        <div className="bg-white border border-gray-300 print:border-0">
          {/* Form Header */}
          <div className="border-b-2 border-gray-300 p-6 print:p-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 print:text-2xl">JOB ORDER FORM</h1>
                <p className="text-gray-600 mt-1">Complete this form for all job orders</p>
              </div>
              <div className="text-right">
                <div className="border-2 border-gray-300 p-3 print:p-2">
                  <p className="text-sm font-medium text-gray-700">JOB ORDER #</p>
                  <div className="h-8 border-b border-gray-400 mt-1 print:h-6"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Job Information Section */}
          <div className="p-6 print:p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 print:text-lg">JOB INFORMATION</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date:</label>
                <div className="border-2 border-gray-300 p-2 h-10 print:h-8">{currentDate}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time:</label>
                <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Type:</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input type="radio" name="jobType" value="internal" className="mr-2" />
                    <span className="text-sm">Internal Job</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="jobType" value="out" className="mr-2" />
                    <span className="text-sm">Out Job</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status:</label>
                <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
              </div>
            </div>
          </div>

          {/* Customer Information Section */}
          <div className="p-6 print:p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 print:text-lg">CUSTOMER INFORMATION</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name:</label>
                <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number:</label>
                <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Design/Product Description:</label>
                <div className="border-2 border-gray-300 p-2 h-16 print:h-12"></div>
              </div>
            </div>
          </div>

          {/* Materials Received Section (For Out Jobs) */}
          <div className="p-6 print:p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 print:text-lg">MATERIALS RECEIVED (For Out Jobs Only)</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 print:text-base">Stones Received:</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Stone Name/Number</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Color</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Size</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Quantity (g/kg)</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map((row) => (
                        <tr key={row}>
                          <td className="border border-gray-300 p-2 h-8 print:h-6"></td>
                          <td className="border border-gray-300 p-2 h-8 print:h-6"></td>
                          <td className="border border-gray-300 p-2 h-8 print:h-6"></td>
                          <td className="border border-gray-300 p-2 h-8 print:h-6"></td>
                          <td className="border border-gray-300 p-2 h-8 print:h-6"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 print:text-base">Paper Received:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Width (inches):</label>
                    <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity (pcs):</label>
                    <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weight per Piece (g):</label>
                    <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Materials Used Section */}
          <div className="p-6 print:p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 print:text-lg">MATERIALS USED</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 print:text-base">Stones Used:</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Stone Name/Number</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Color</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Size</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Quantity Used (g/kg)</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map((row) => (
                        <tr key={row}>
                          <td className="border border-gray-300 p-2 h-8 print:h-6"></td>
                          <td className="border border-gray-300 p-2 h-8 print:h-6"></td>
                          <td className="border border-gray-300 p-2 h-8 print:h-6"></td>
                          <td className="border border-gray-300 p-2 h-8 print:h-6"></td>
                          <td className="border border-gray-300 p-2 h-8 print:h-6"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 print:text-base">Paper Used:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Width (inches):</label>
                    <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity (pcs):</label>
                    <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weight per Piece (g):</label>
                    <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Weight Calculations Section */}
          <div className="p-6 print:p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 print:text-lg">WEIGHT CALCULATIONS</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Calculated Weight (g):</label>
                <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Final Total Weight (g):</label>
                <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weight Discrepancy (g):</label>
                <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discrepancy %:</label>
                <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
              </div>
            </div>
          </div>

          {/* For Out Jobs - Stone Usage Analysis */}
          <div className="p-6 print:p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 print:text-lg">STONE USAGE ANALYSIS (For Out Jobs)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stone Used (g):</label>
                <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stone Balance (g):</label>
                <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stone Loss (g):</label>
                <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Paper Balance (pcs):</label>
                <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="p-6 print:p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 print:text-lg">NOTES & COMMENTS</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions:</label>
                <div className="border-2 border-gray-300 p-2 h-16 print:h-12"></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quality Issues:</label>
                <div className="border-2 border-gray-300 p-2 h-16 print:h-12"></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Comments:</label>
                <div className="border-2 border-gray-300 p-2 h-16 print:h-12"></div>
              </div>
            </div>
          </div>

          {/* Signatures Section */}
          <div className="p-6 print:p-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4 print:text-lg">SIGNATURES & APPROVALS</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prepared By:</label>
                <div className="border-2 border-gray-300 p-2 h-16 print:h-12"></div>
                <p className="text-xs text-gray-500 mt-1">Employee Name & Signature</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Checked By:</label>
                <div className="border-2 border-gray-300 p-2 h-16 print:h-12"></div>
                <p className="text-xs text-gray-500 mt-1">Supervisor Name & Signature</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Approved By:</label>
                <div className="border-2 border-gray-300 p-2 h-16 print:h-12"></div>
                <p className="text-xs text-gray-500 mt-1">Manager Name & Signature</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date:</label>
                <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time:</label>
                <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 print:mt-4">
          <p>This form must be completed for all job orders and filed for audit purposes.</p>
          <p className="mt-1">Form Version: 1.0 | Last Updated: {currentDate}</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0.5in;
            size: A4;
          }
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:p-4 {
            padding: 1rem !important;
          }
          .print\\:p-2 {
            padding: 0.5rem !important;
          }
          .print\\:max-w-none {
            max-width: none !important;
          }
          .print\\:border-0 {
            border: 0 !important;
          }
          .print\\:text-2xl {
            font-size: 1.5rem !important;
          }
          .print\\:text-lg {
            font-size: 1.125rem !important;
          }
          .print\\:text-base {
            font-size: 1rem !important;
          }
          .print\\:h-8 {
            height: 2rem !important;
          }
          .print\\:h-6 {
            height: 1.5rem !important;
          }
          .print\\:h-12 {
            height: 3rem !important;
          }
          .print\\:h-10 {
            height: 2.5rem !important;
          }
          .print\\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .print\\:grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
          .print\\:mt-4 {
            margin-top: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
