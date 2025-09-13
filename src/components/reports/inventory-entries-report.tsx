'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useSnackbarHelpers } from '@/components/ui/snackbar';
import { useAuth } from '@/lib/auth-context';
import { authenticatedFetch } from '@/lib/utils';
import { Package, Calendar, User } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

interface InventoryEntry {
  _id: string;
  entryType: 'purchase' | 'return' | 'adjustment';
  inventoryType: 'paper' | 'plastic' | 'stones' | 'tape';
  supplier?: {
    _id: string;
    name: string;
    contactPerson?: string;
    phone?: string;
  };
  billNumber?: string;
  billDate?: string;
  items: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
  }>;
  totalAmount?: number;
  notes?: string;
  source?: 'order' | 'other';
  sourceOrderId?: {
    _id: string;
    orderNumber: string;
    customerName: string;
  };
  sourceDescription?: string;
  enteredBy: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function InventoryEntriesReport() {
  const [entries, setEntries] = useState<InventoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [inventoryType, setInventoryType] = useState('all');
  const [entryType, setEntryType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (entryId: string) => {
    // Prevent rapid clicking
    if (openDropdown === entryId) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(entryId);
    }
  };

  const { showError } = useSnackbarHelpers();
  const { loading: authLoading, isAuthenticated } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (openDropdown && !target.closest('[data-dropdown]')) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const fetchEntries = useCallback(
    async (isRefresh = false) => {
      try {
        console.log('fetchEntries called with params:', {
          currentPage,
          itemsPerPage,
          inventoryType,
          entryType,
          startDate,
          endDate,
          isRefresh,
        });

        if (isRefresh) {
          setRefreshing(true);
        }

        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
        });

        if (inventoryType && inventoryType !== 'all')
          params.append('inventoryType', inventoryType);
        if (entryType && entryType !== 'all')
          params.append('entryType', entryType);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await authenticatedFetch(
          `/api/inventory-entries?${params}`,
        );
        const data = await response.json();

        if (data.success) {
          setEntries(data.data);
          setTotalPages(data.pagination.pages);
          setTotalItems(data.pagination.total);
        } else {
          showError('Error', 'Failed to load inventory entries');
        }
      } catch (error) {
        console.error('Error fetching inventory entries:', error);
        showError('Error', 'Failed to load inventory entries');
      } finally {
        setLoading(false);
        if (isRefresh) {
          setRefreshing(false);
        }
      }
    },
    [
      currentPage,
      itemsPerPage,
      inventoryType,
      entryType,
      startDate,
      endDate,
      showError,
    ],
  );

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchEntries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authLoading,
    isAuthenticated,
    currentPage,
    itemsPerPage,
    inventoryType,
    entryType,
    startDate,
    endDate,
  ]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
    // fetchEntries will be called automatically by useEffect when state changes
  };

  const clearFilters = () => {
    setInventoryType('all');
    setEntryType('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const getEntryTypeBadge = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Badge variant="default">Purchase</Badge>;
      case 'return':
        return <Badge variant="secondary">Return</Badge>;
      case 'adjustment':
        return <Badge variant="outline">Adjustment</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const ItemsDisplay = ({ entry }: { entry: InventoryEntry }) => {
    const { items } = entry;

    // console.log('items', items);

    if (items.length === 0) {
      return <span className="text-muted-foreground">No items</span>;
    }

    if (items.length === 1) {
      return (
        <div className="text-sm">
          <span className="font-medium text-foreground">
            {items[0].itemName}
          </span>
          <span className="text-muted-foreground ml-1">
            ({items[0].quantity} {items[0].unit})
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <div className="text-sm">
          <span className="font-medium text-foreground">
            {items[0].itemName}
          </span>
          <span className="text-muted-foreground ml-1">
            ({items[0].quantity} {items[0].unit})
          </span>
        </div>
        <div
          className="relative"
          data-dropdown
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleDropdown(entry._id);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer underline"
            type="button"
          >
            {items.length - 1} more
          </button>

          {openDropdown === entry._id && (
            <div
              className="absolute top-6 left-0 z-50 bg-popover border border-border rounded-md shadow-lg p-3 min-w-[200px]"
              data-dropdown
            >
              <div className="text-xs">
                <div className="font-medium mb-2 text-popover-foreground">
                  All Items ({items.length}):
                </div>
                <div className="space-y-1">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="text-xs text-popover-foreground"
                    >
                      <span className="font-medium">{item.itemName}</span>
                      <span className="text-muted-foreground ml-1">
                        ({item.quantity} {item.unit})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Entries Report</h1>
          <p className="text-muted-foreground">
            Track all inventory additions and returns
          </p>
        </div>
        {refreshing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner size="sm" />
            <span>Refreshing...</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-muted rounded-lg">
        <div className="space-y-2">
          <Label>Inventory Type</Label>
          <Select
            value={inventoryType || undefined}
            onValueChange={setInventoryType}
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="paper">Paper</SelectItem>
              <SelectItem value="plastic">Plastic</SelectItem>
              <SelectItem value="stones">Stones</SelectItem>
              <SelectItem value="tape">Tape</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Entry Type</Label>
          <Select
            value={entryType || undefined}
            onValueChange={setEntryType}
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="purchase">Purchase</SelectItem>
              <SelectItem value="return">Return</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>End Date</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="flex items-end gap-2">
          <Button
            onClick={handleFilterChange}
            className="flex-1"
          >
            Apply Filters
          </Button>
          <Button
            variant="outline"
            onClick={clearFilters}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Results */}
      {entries.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Inventory Entries Found"
          description="No inventory entries match your current filters."
        />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Inventory</TableHead>
                <TableHead>Supplier/Source</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Entered By</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry._id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(entry.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>{getEntryTypeBadge(entry.entryType)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="capitalize"
                    >
                      {entry.inventoryType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {entry.entryType === 'purchase' && entry.supplier ? (
                      <div>
                        <div className="font-medium">{entry.supplier.name}</div>
                        {entry.billNumber && (
                          <div className="text-sm text-muted-foreground">
                            Bill: {entry.billNumber}
                          </div>
                        )}
                      </div>
                    ) : entry.entryType === 'return' ? (
                      <div>
                        {entry.source === 'order' && entry.sourceOrderId ? (
                          <div>
                            <div className="font-medium">
                              Order #{entry.sourceOrderId.orderNumber}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {entry.sourceOrderId.customerName}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm">
                            {entry.sourceDescription}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <ItemsDisplay entry={entry} />
                    </div>
                  </TableCell>
                  <TableCell>
                    {entry.totalAmount ? (
                      <span className="font-medium">
                        ₹{entry.totalAmount.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {entry.enteredBy.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {entry.enteredBy.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(entry.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
      />
    </div>
  );
}
