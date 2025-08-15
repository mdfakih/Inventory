'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';

export default function InventoryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/inventory/stones');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-8">
      <Spinner size="lg" />
    </div>
  );
}
