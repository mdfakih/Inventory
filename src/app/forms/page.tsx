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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Printable Forms</h1>
        <p className="text-gray-600">
          Download and print forms for maintaining paper trails and easy data
          entry
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {forms.map((form) => (
          <Card
            key={form.id}
            className="hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${form.color} text-white`}>
                    <form.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{form.title}</CardTitle>
                    <Badge
                      variant="outline"
                      className="mt-1"
                    >
                      {form.type}
                    </Badge>
                  </div>
                </div>
              </div>
              <CardDescription className="text-base">
                {form.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Features:</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {form.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center"
                      >
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={() => router.push(form.href)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Form
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(form.href, '_blank')}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">
            How to Use These Forms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium">Print the appropriate form</p>
                <p className="text-gray-600">
                  Choose the form based on your job type (Internal or Out)
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium">Fill out the form completely</p>
                <p className="text-gray-600">
                  Record all required information including materials, weights,
                  and signatures
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium">Enter data into the system</p>
                <p className="text-gray-600">
                  Use the completed form as reference to enter data into the
                  inventory system
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                4
              </div>
              <div>
                <p className="font-medium">File the form</p>
                <p className="text-gray-600">
                  Keep the completed form for audit trail and record keeping
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
