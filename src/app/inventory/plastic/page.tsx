'use client';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import PlasticTable from '@/components/inventory/plastic-table';

export default function PlasticPage() {
  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <Card>
        <CardContent>
          <PlasticTable />
        </CardContent>
      </Card>
    </div>
  );
}
