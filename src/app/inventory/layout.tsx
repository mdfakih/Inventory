'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  FileText, 
  Layers, 
  Scissors,
  ChevronRight,
  Plus
} from 'lucide-react';

const inventoryItems = [
  {
    id: 'stones',
    label: 'Stones',
    href: '/inventory/stones',
    icon: Package,
    description: 'Manage stone inventory'
  },
  {
    id: 'paper',
    label: 'Paper',
    href: '/inventory/paper',
    icon: FileText,
    description: 'Manage paper rolls'
  },
  {
    id: 'plastic',
    label: 'Plastic',
    href: '/inventory/plastic',
    icon: Layers,
    description: 'Manage packaging plastic'
  },
  {
    id: 'tape',
    label: 'Tape',
    href: '/inventory/tape',
    icon: Scissors,
    description: 'Manage cello tape'
  }
];

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-16'} bg-background border-r transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {isSidebarOpen && (
              <h2 className="text-lg font-semibold">Inventory</h2>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="ml-auto"
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>

        <nav className="flex-1 p-2">
          <div className="space-y-1">
            {inventoryItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link key={item.id} href={item.href}>
                  <div
                    className={`flex items-center p-3 rounded-lg transition-colors cursor-pointer group ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {isSidebarOpen && (
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">
                            {item.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.description}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
