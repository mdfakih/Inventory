'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Printer, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FormsPage() {
  const router = useRouter();

  const forms = [
    {
      id: 'job-order-form',
      title: 'Job Order Form',
      description:
        'Printable form for recording job details and materials used',
      type: 'Both Internal & Out Jobs',
      features: [
        'Customer information section',
        'Job type selection (Internal/Out)',
        'Materials received section (for out jobs)',
        'Materials used section',
        'Weight calculations',
        'Manager signature area',
        'Date and time stamps',
      ],
      icon: FileText,
      color: 'bg-blue-500',
      href: '/forms/job-order',
    },
    {
      id: 'inventory-receipt-form',
      title: 'Inventory Receipt Form',
      description:
        'Form for recording received materials and inventory updates',
      type: 'Inventory Management',
      features: [
        'Received materials tracking',
        'Supplier information',
        'Quantity verification',
        'Quality check section',
        'Received by signature',
        'Date and batch numbers',
      ],
      icon: FileText,
      color: 'bg-green-500',
      href: '/forms/inventory-receipt',
    },
  ];

  return (
    <div className="container mx-auto space-y-8 p-6 md:p-8">
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Printable Forms
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Download and print forms for maintaining paper trails and easy data
          entry
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {forms.map((form) => (
          <Card
            key={form.id}
            className="hover:shadow-xl transition-all duration-300 border-2 hover:border-gray-300"
          >
            <CardHeader className="space-y-4 pb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className={`p-3 rounded-xl ${form.color} text-white shadow-lg`}
                  >
                    <form.icon className="h-7 w-7" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      {form.title}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="text-sm font-medium px-3 py-1"
                    >
                      {form.type}
                    </Badge>
                  </div>
                </div>
              </div>
              <CardDescription className="text-base leading-relaxed text-gray-600">
                {form.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg mb-3 text-gray-900">
                    Features:
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {form.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start space-x-3"
                      >
                        <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex space-x-3 pt-6">
                  <Button
                    onClick={() => router.push(form.href)}
                    className="flex-1 h-12 text-base font-medium"
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    View Form
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(form.href, '_blank')}
                    className="h-12 w-12 p-0"
                  >
                    <Printer className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold text-blue-900">
            How to Use These Forms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">
                    Print the appropriate form
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    Choose the form based on your job type (Internal or Out)
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">
                    Fill out the form
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    Complete all required fields with accurate information
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">Get signatures</p>
                  <p className="text-gray-600 leading-relaxed">
                    Have the appropriate personnel sign the form
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  4
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">
                    File for records
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    Keep the completed form for future reference
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
