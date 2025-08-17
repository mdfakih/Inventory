'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import PaperTable from '@/components/inventory/paper-table';
import { Spinner } from '@/components/ui/spinner';

function PaperPageContent() {
  const searchParams = useSearchParams();
  const inventoryType = (searchParams.get('type') || 'internal') as
    | 'internal'
    | 'out';



  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <Card>
        <CardContent>
          <PaperTable inventoryType={inventoryType} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaperPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </div>
      }
    >
      <PaperPageContent />
    </Suspense>
  );
}
