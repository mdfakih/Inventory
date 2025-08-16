'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Package,
  FileText,
  Layers,
  Scissors,
  ChevronRight,
  Building2,
  ExternalLink,
} from 'lucide-react';

const inventoryItems = [
  {
    id: 'internal',
    label: 'Internal Inventory',
    icon: Building2,
    description: 'Internal job materials',
    items: [
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
    ],
  },
  {
    id: 'out',
    label: 'Out Job Inventory',
    icon: ExternalLink,
    description: 'Customer provided materials',
    items: [
      {
        id: 'out-inventory',
        label: 'Out Inventory',
        href: '/inventory/out',
        icon: Package,
        description: 'Manage out job inventory',
      },
      {
        id: 'out-stones',
        label: 'Stones',
        href: '/inventory/stones?type=out',
        icon: Package,
        description: 'Manage received stones',
      },
      {
        id: 'out-paper',
        label: 'Paper',
        href: '/inventory/paper?type=out',
        icon: FileText,
        description: 'Manage received paper',
      },
    ],
  },
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

        <nav className="flex-1 p-2 overflow-y-auto">
          <div className="space-y-4">
            {inventoryItems.map((section) => {
              const SectionIcon = section.icon;

              return (
                <div
                  key={section.id}
                  className="space-y-1"
                >
                  {isSidebarOpen && (
                    <div className="px-3 py-2">
                      <div className="flex items-center space-x-2">
                        <SectionIcon className="h-4 w-4" />
                        <span className="text-sm font-medium text-muted-foreground">
                          {section.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">
                        {section.description}
                      </p>
                    </div>
                  )}

                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname.includes(item.href.split('?')[0]) &&
                      (item.href.includes('type=')
                        ? pathname.includes(item.href.split('type=')[1])
                        : !pathname.includes('type='));

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
