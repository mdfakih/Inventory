'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import StonesTable from '@/components/inventory/stones-table';
import { Spinner } from '@/components/ui/spinner';

function StonesPageContent() {
  const searchParams = useSearchParams();
  const inventoryType = (searchParams.get('type') || 'internal') as
    | 'internal'
    | 'out';



  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <Card>
        <CardContent>
          <StonesTable inventoryType={inventoryType} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function StonesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </div>
      }
    >
      <StonesPageContent />
    </Suspense>
  );
}
