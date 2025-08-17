'use client';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import TapeTable from '@/components/inventory/tape-table';

export default function TapePage() {
  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <Card>
        <CardContent>
          <TapeTable />
        </CardContent>
      </Card>
    </div>
  );
}
