'use client';

import { useState, useEffect } from 'react';
import { authenticatedFetch } from '@/lib/utils';

interface Plastic {
  _id: string;
  name: string;
  width: number;
  quantity: number;
  unit: string;
}

interface Tape {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
}

export default function TestOtherItemsPage() {
  const [plastics, setPlastics] = useState<Plastic[]>([]);
  const [tapes, setTapes] = useState<Tape[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plasticsRes, tapesRes] = await Promise.all([
        authenticatedFetch('/api/inventory/plastic'),
        authenticatedFetch('/api/inventory/tape'),
      ]);

      const plasticsData = await plasticsRes.json();
      const tapesData = await tapesRes.json();

      if (plasticsData.success) {
        setPlastics(plasticsData.data);
        console.log('Plastics loaded:', plasticsData.data);
      }
      if (tapesData.success) {
        setTapes(tapesData.data);
        console.log('Tapes loaded:', tapesData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Test Other Inventory Items</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Plastics ({plastics.length})</h2>
          <div className="space-y-2">
            {plastics.map((plastic) => (
              <div key={plastic._id} className="p-3 border rounded">
                <div className="font-medium">{plastic.name}</div>
                <div className="text-sm text-gray-600">
                  Width: {plastic.width}&quot;, Quantity: {plastic.quantity} {plastic.unit}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Tapes ({tapes.length})</h2>
          <div className="space-y-2">
            {tapes.map((tape) => (
              <div key={tape._id} className="p-3 border rounded">
                <div className="font-medium">{tape.name}</div>
                <div className="text-sm text-gray-600">
                  Quantity: {tape.quantity} {tape.unit}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Test Order Form Data</h2>
        <div className="p-4 bg-gray-100 rounded">
          <pre className="text-sm">
            {JSON.stringify({
              plastics: plastics.map(p => ({ id: p._id, name: p.name, width: p.width })),
              tapes: tapes.map(t => ({ id: t._id, name: t.name })),
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
