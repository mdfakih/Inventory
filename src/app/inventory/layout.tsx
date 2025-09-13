'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
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

function InventoryLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Determine current tab based on URL or default to internal
  const currentTab = searchParams.get('type') === 'out' ? 'out' : 'internal';
  const currentItems =
    currentTab === 'out' ? outJobInventoryItems : internalInventoryItems;

  const handleTabChange = (value: string) => {
    // Navigate to the first item in the selected category
    if (value === 'out') {
      // Navigate to the first out job item (stones)
      router.push('/inventory/stones?type=out');
    } else {
      // Navigate to the first internal item (stones)
      router.push('/inventory/stones?type=internal');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
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
            <Tabs
              value={currentTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="internal"
                  className="flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  Internal
                </TabsTrigger>
                <TabsTrigger
                  value="out"
                  className="flex items-center gap-2"
                >
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

              // Only calculate active state on client side to avoid hydration mismatch
              let isActive = false;
              if (isClient) {
                // Extract the base path from the href
                const basePath = item.href.split('?')[0];

                // Check if current pathname matches the base path
                const pathMatches = pathname === basePath;

                // For items with type parameter, check if the type matches or if no type is specified (defaults to internal)
                let typeMatches = true;
                if (item.href.includes('type=')) {
                  const expectedType = item.href.split('type=')[1];
                  const currentType = searchParams.get('type') || 'internal'; // Default to internal if no type specified
                  typeMatches = currentType === expectedType;
                } else {
                  // For items without type parameter, ensure no type is specified
                  typeMatches = !searchParams.get('type');
                }

                isActive = pathMatches && typeMatches;
              }

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
        <div className="container mx-auto px-4 py-4 sm:py-8">{children}</div>
      </div>
    </div>
  );
}

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          Loading...
        </div>
      }
    >
      <InventoryLayoutContent>{children}</InventoryLayoutContent>
    </Suspense>
  );
}
