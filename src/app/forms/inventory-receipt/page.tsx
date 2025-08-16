'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function InventoryReceiptFormPage() {
  const router = useRouter();
  const [currentDate] = useState(new Date().toLocaleDateString());

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block text-center py-4 border-b-2 border-gray-300">
        <h1 className="text-2xl font-bold text-gray-800">INVENTORY RECEIPT FORM</h1>
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
                <h1 className="text-3xl font-bold text-gray-800 print:text-2xl">INVENTORY RECEIPT FORM</h1>
                <p className="text-gray-600 mt-1">Record received materials and inventory updates</p>
              </div>
              <div className="text-right">
                <div className="border-2 border-gray-300 p-3 print:p-2">
                  <p className="text-sm font-medium text-gray-700">RECEIPT #</p>
                  <div className="h-8 border-b border-gray-400 mt-1 print:h-6"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Receipt Information Section */}
          <div className="p-6 print:p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 print:text-lg">RECEIPT INFORMATION</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Received:</label>
                <div className="border-2 border-gray-300 p-2 h-10 print:h-8">{currentDate}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Received:</label>
                <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Inventory Type:</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input type="radio" name="inventoryType" value="internal" className="mr-2" />
                    <span className="text-sm">Internal</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="inventoryType" value="out" className="mr-2" />
                    <span className="text-sm">Out Job</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number:</label>
                <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
              </div>
            </div>
          </div>

          {/* Supplier Information Section */}
          <div className="p-6 print:p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 print:text-lg">SUPPLIER INFORMATION</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name:</label>
                <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person:</label>
                <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number:</label>
                <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email:</label>
                <div className="border-2 border-gray-300 p-2 h-10 print:h-8"></div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Address:</label>
                <div className="border-2 border-gray-300 p-2 h-16 print:h-12"></div>
              </div>
            </div>
          </div>

          {/* Materials Received Section */}
          <div className="p-6 print:p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 print:text-lg">MATERIALS RECEIVED</h2>
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
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Quantity Received</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Unit</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Quality Check</th>
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
                          <td className="border border-gray-300 p-2 h-8 print:h-6">
                            <div className="flex space-x-2">
                              <label className="flex items-center">
                                <input type="radio" name={`quality-${row}`} value="pass" className="mr-1" />
                                <span className="text-xs">Pass</span>
                              </label>
                              <label className="flex items-center">
                                <input type="radio" name={`quality-${row}`} value="fail" className="mr-1" />
                                <span className="text-xs">Fail</span>
                              </label>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 print:text-base">Paper Received:</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Width (inches)</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Quantity (pcs)</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Pieces per Roll</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Weight per Piece (g)</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Quality Check</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3].map((row) => (
                        <tr key={row}>
                          <td className="border border-gray-300 p-2 h-8 print:h-6"></td>
                          <td className="border border-gray-300 p-2 h-8 print:h-6"></td>
                          <td className="border border-gray-300 p-2 h-8 print:h-6"></td>
                          <td className="border border-gray-300 p-2 h-8 print:h-6"></td>
                          <td className="border border-gray-300 p-2 h-8 print:h-6">
                            <div className="flex space-x-2">
                              <label className="flex items-center">
                                <input type="radio" name={`paper-quality-${row}`} value="pass" className="mr-1" />
                                <span className="text-xs">Pass</span>
                              </label>
                              <label className="flex items-center">
                                <input type="radio" name={`paper-quality-${row}`} value="fail" className="mr-1" />
                                <span className="text-xs">Fail</span>
                              </label>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 print:text-base">Other Materials:</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Material Type</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Description</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Quantity</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Unit</th>
                        <th className="border border-gray-300 p-2 text-left text-sm font-medium">Quality Check</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3].map((row) => (
                        <tr key={row}>
                          <td className="border border-gray-300 p-2 h-8 print:h-6"></td>
                          <td className="border border-gray-300 p-2 h-8 print:h-6"></td>
                          <td className="border border-gray-300 p-2 h-8 print:h-6"></td>
                          <td className="border border-gray-300 p-2 h-8 print:h-6"></td>
                          <td className="border border-gray-300 p-2 h-8 print:h-6">
                            <div className="flex space-x-2">
                              <label className="flex items-center">
                                <input type="radio" name={`other-quality-${row}`} value="pass" className="mr-1" />
                                <span className="text-xs">Pass</span>
                              </label>
                              <label className="flex items-center">
                                <input type="radio" name={`other-quality-${row}`} value="fail" className="mr-1" />
                                <span className="text-xs">Fail</span>
                              </label>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Quality Check Section */}
          <div className="p-6 print:p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 print:text-lg">QUALITY CHECK</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Overall Quality Rating:</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input type="radio" name="overallQuality" value="excellent" className="mr-2" />
                      <span className="text-sm">Excellent</span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="overallQuality" value="good" className="mr-2" />
                      <span className="text-sm">Good</span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="overallQuality" value="fair" className="mr-2" />
                      <span className="text-sm">Fair</span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="overallQuality" value="poor" className="mr-2" />
                      <span className="text-sm">Poor</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Packaging Condition:</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input type="radio" name="packaging" value="excellent" className="mr-2" />
                      <span className="text-sm">Excellent</span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="packaging" value="good" className="mr-2" />
                      <span className="text-sm">Good</span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="packaging" value="damaged" className="mr-2" />
                      <span className="text-sm">Damaged</span>
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quality Issues Found:</label>
                <div className="border-2 border-gray-300 p-2 h-16 print:h-12"></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action Taken:</label>
                <div className="border-2 border-gray-300 p-2 h-16 print:h-12"></div>
              </div>
            </div>
          </div>

          {/* Verification Section */}
          <div className="p-6 print:p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 print:text-lg">VERIFICATION</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity Verified:</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input type="radio" name="quantityVerified" value="yes" className="mr-2" />
                    <span className="text-sm">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="quantityVerified" value="no" className="mr-2" />
                    <span className="text-sm">No</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specifications Match:</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input type="radio" name="specificationsMatch" value="yes" className="mr-2" />
                    <span className="text-sm">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="specificationsMatch" value="no" className="mr-2" />
                    <span className="text-sm">No</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discrepancies Found:</label>
                <div className="border-2 border-gray-300 p-2 h-16 print:h-12"></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Corrective Actions:</label>
                <div className="border-2 border-gray-300 p-2 h-16 print:h-12"></div>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Notes:</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Received By:</label>
                <div className="border-2 border-gray-300 p-2 h-16 print:h-12"></div>
                <p className="text-xs text-gray-500 mt-1">Employee Name & Signature</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quality Checked By:</label>
                <div className="border-2 border-gray-300 p-2 h-16 print:h-12"></div>
                <p className="text-xs text-gray-500 mt-1">Quality Inspector Name & Signature</p>
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
          <p>This form must be completed for all received materials and filed for audit purposes.</p>
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
