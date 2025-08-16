'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  FileText,
  Layers,
  Scissors,
  ChevronRight,
  Building2,
  ExternalLink,
} from 'lucide-react';

const internalInventoryItems = [
  {
    id: 'stones',
    label: 'Stones',
    href: '/inventory/stones?type=internal',
    icon: Package,
    description: 'Manage stone inventory',
  },
  {
    id: 'paper',
    label: 'Paper',
    href: '/inventory/paper?type=internal',
    icon: FileText,
    description: 'Manage paper rolls',
  },
  {
    id: 'plastic',
    label: 'Plastic',
    href: '/inventory/plastic',
    icon: Layers,
    description: 'Manage packaging plastic',
  },
  {
    id: 'tape',
    label: 'Tape',
    href: '/inventory/tape',
    icon: Scissors,
    description: 'Manage cello tape',
  },
];

const outJobInventoryItems = [
  {
    id: 'stones',
    label: 'Stones',
    href: '/inventory/stones?type=out',
    icon: Package,
    description: 'Manage received stones',
  },
  {
    id: 'paper',
    label: 'Paper',
    href: '/inventory/paper?type=out',
    icon: FileText,
    description: 'Manage received paper',
  },
];

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Determine current tab based on URL or default to internal
  const currentTab = searchParams.get('type') === 'out' ? 'out' : 'internal';
  const currentItems = currentTab === 'out' ? outJobInventoryItems : internalInventoryItems;

  const handleTabChange = (value: string) => {
    // Update the URL to reflect the selected tab
    const url = new URL(window.location.href);
    if (value === 'out') {
      url.searchParams.set('type', 'out');
    } else {
      url.searchParams.delete('type');
    }
    window.history.pushState({}, '', url.toString());
    // Force a page reload to update the content
    window.location.reload();
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? 'w-64' : 'w-16'
        } bg-background border-r transition-all duration-300 flex flex-col`}
      >
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
              <ChevronRight
                className={`h-4 w-4 transition-transform ${
                  isSidebarOpen ? 'rotate-180' : ''
                }`}
              />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        {isSidebarOpen && (
          <div className="p-4 border-b">
            <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="internal" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Internal
                </TabsTrigger>
                <TabsTrigger value="out" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Out Jobs
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        <nav className="flex-1 p-2 overflow-y-auto">
          <div className="space-y-1">
            {currentItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.includes(item.href.split('?')[0]) &&
                (item.href.includes('type=') 
                  ? searchParams.get('type') === item.href.split('type=')[1]
                  : !searchParams.get('type'));

              return (
                <Link
                  key={item.id}
                  href={item.href}
                >
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
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
