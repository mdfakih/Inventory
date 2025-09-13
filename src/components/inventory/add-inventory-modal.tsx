'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TypeableSelect } from '@/components/ui/typeable-select';
import { authenticatedFetch, safeJsonParse } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoadingButton } from '@/components/ui/loading-button';
import { useSnackbarHelpers } from '@/components/ui/snackbar';
import { useAuth } from '@/lib/auth-context';
import { Plus, Trash2 } from 'lucide-react';

interface InventoryItem {
  inventoryType: 'stones' | 'paper' | 'plastic' | 'tape' | '';
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  piecesPerRoll?: number;
  weightPerPiece?: number;
  width?: number;
}

interface ApiInventoryItem {
  _id: string;
  name: string;
  quantity: number;
  unit?: string;
  piecesPerRoll?: number;
  weightPerPiece?: number;
  width?: number;
}

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  inventoryType?: 'internal' | 'out';
}

export default function AddInventoryModal({
  isOpen,
  onClose,
  onSuccess,
}: AddInventoryModalProps) {
  const [entryType, setEntryType] = useState<'purchase' | 'return'>('purchase');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState('');
  const [items, setItems] = useState<InventoryItem[]>([
    {
      inventoryType: '',
      itemId: '',
      itemName: '',
      quantity: 1,
      unit: 'pcs',
    },
  ]);
  const [totalAmount, setTotalAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState<'order' | 'other'>('order');
  const [sourceOrderId, setSourceOrderId] = useState('');
  const [sourceDescription, setSourceDescription] = useState('');
  const [inventoryItems, setInventoryItems] = useState<ApiInventoryItem[]>([]);
  const [orders, setOrders] = useState<
    Array<{
      _id: string;
      customerName: string;
      type: string;
      createdAt: string;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const { showSuccess, showError } = useSnackbarHelpers();
  const { user } = useAuth();

  const fetchInventoryItems = useCallback(
    async (inventoryType: string) => {
      setLoadingInventory(true);
      try {
        let allItems: ApiInventoryItem[] = [];

        if (inventoryType === 'stones' || inventoryType === 'paper') {
          // For stones and paper, fetch from both internal and out jobs
          const [internalResponse, outResponse] = await Promise.all([
            fetch(`/api/inventory/${inventoryType}?all=true&type=internal`),
            fetch(`/api/inventory/${inventoryType}?all=true&type=out`),
          ]);

          // Check response status before parsing
          if (!internalResponse.ok) {
            console.error(
              `Internal ${inventoryType} API error:`,
              internalResponse.status,
              internalResponse.statusText,
            );
            const errorText = await internalResponse.text();
            console.error('Error response:', errorText.substring(0, 200));
          }
          if (!outResponse.ok) {
            console.error(
              `Out ${inventoryType} API error:`,
              outResponse.status,
              outResponse.statusText,
            );
            const errorText = await outResponse.text();
            console.error('Error response:', errorText.substring(0, 200));
          }

          const [internalData, outData] = await Promise.all([
            internalResponse.ok
              ? safeJsonParse<{ success: boolean; data: ApiInventoryItem[] }>(
                  internalResponse,
                )
              : { success: false, data: [] },
            outResponse.ok
              ? safeJsonParse<{ success: boolean; data: ApiInventoryItem[] }>(
                  outResponse,
                )
              : { success: false, data: [] },
          ]);

          if (internalData.success) {
            allItems = [...allItems, ...(internalData.data || [])];
          }
          if (outData.success) {
            allItems = [...allItems, ...(outData.data || [])];
          }
        } else {
          // For plastic and tape, fetch normally (they don't have internal/out distinction)
          const response = await fetch(
            `/api/inventory/${inventoryType}?all=true`,
          );

          // Check response status before parsing
          if (!response.ok) {
            console.error(
              `${inventoryType} API error:`,
              response.status,
              response.statusText,
            );
            const errorText = await response.text();
            console.error('Error response:', errorText.substring(0, 200));
            throw new Error(
              `API request failed: ${response.status} ${response.statusText}`,
            );
          }

          const data = await safeJsonParse<{
            success: boolean;
            data: ApiInventoryItem[];
          }>(response);
          if (data.success) {
            allItems = data.data || [];
          }
        }

        setInventoryItems(allItems);
      } catch (error) {
        console.error('Error fetching inventory items:', error);
        showError(
          'Error',
          `Failed to load ${inventoryType} items. Please check if the server is running.`,
        );
        setInventoryItems([]);
      } finally {
        setLoadingInventory(false);
      }
    },
    [showError],
  );

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const response = await authenticatedFetch('/api/orders?limit=100');
      const data = await safeJsonParse<{
        success: boolean;
        data: Array<{
          _id: string;
          customerName: string;
          type: string;
          createdAt: string;
        }>;
      }>(response);
      if (data.success) {
        setOrders(data.data);
      } else {
        showError('Error', 'Failed to load orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showError('Error', 'Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  }, [showError]);

  // Fetch orders when return type is selected
  useEffect(() => {
    if (isOpen && entryType === 'return' && source === 'order') {
      fetchOrders();
    }
  }, [isOpen, entryType, source, fetchOrders]);

  const addItemRow = () => {
    setItems([
      ...items,
      {
        inventoryType: '',
        itemId: '',
        itemName: '',
        quantity: 1,
        unit: 'pcs',
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = async (
    index: number,
    field: keyof InventoryItem,
    value: string | number,
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // If inventory type changed, reset item and load new items
    if (field === 'inventoryType') {
      newItems[index] = {
        ...newItems[index],
        itemId: '',
        itemName: '',
        unit: 'pcs',
      };
      // Load items for the new inventory type
      await fetchInventoryItems(value as string);
    }

    // If itemId changed, update item details including unit
    if (field === 'itemId') {
      if (value) {
        // Item was selected, update details
        const selectedItem = inventoryItems.find((item) => item._id === value);
        if (selectedItem) {
          newItems[index] = {
            ...newItems[index],
            itemName: selectedItem.name,
            unit: selectedItem.unit || 'pcs',
            piecesPerRoll: selectedItem.piecesPerRoll,
            weightPerPiece: selectedItem.weightPerPiece,
            width: selectedItem.width,
          };
        }
      } else {
        // Item was cleared, reset item details
        newItems[index] = {
          ...newItems[index],
          itemName: '',
          unit: 'pcs',
          piecesPerRoll: undefined,
          weightPerPiece: undefined,
          width: undefined,
        };
      }
    }

    // If quantity changed, ensure it's not zero or negative
    if (field === 'quantity') {
      const numValue = Number(value);
      if (numValue <= 0) {
        newItems[index] = { ...newItems[index], quantity: 1 };
      }
    }

    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showError('Error', 'User not authenticated');
      return;
    }

    // Validate form

    if (entryType === 'purchase') {
      if (!selectedSupplier.trim()) {
        showError('Validation Error', 'Please enter a supplier name');
        return;
      }

      if (!billNumber.trim()) {
        showError('Validation Error', 'Please enter a bill number');
        return;
      }

      if (!billDate.trim()) {
        showError('Validation Error', 'Please enter a bill date');
        return;
      }
    }

    if (entryType === 'return' && source === 'other' && !sourceDescription) {
      showError('Validation Error', 'Please provide source description');
      return;
    }

    const validItems = items.filter(
      (item) =>
        item.inventoryType &&
        item.itemId &&
        item.itemId.trim() !== '' &&
        item.quantity > 0,
    );
    if (validItems.length === 0) {
      showError(
        'Validation Error',
        'Please add at least one valid item with inventory type and item selected',
      );
      return;
    }

    // Check for items without selected items
    const itemsWithoutSelection = items.filter(
      (item) =>
        item.inventoryType && (!item.itemId || item.itemId.trim() === ''),
    );
    if (itemsWithoutSelection.length > 0) {
      showError(
        'Validation Error',
        'Please select an item for all inventory types. Some items are missing their selection.',
      );
      return;
    }

    // Check for zero or negative quantities
    const invalidQuantities = items.filter((item) => item.quantity <= 0);
    if (invalidQuantities.length > 0) {
      showError('Validation Error', 'All quantities must be greater than zero');
      return;
    }

    setLoading(true);
    try {
      // Validate that all items have valid inventory types
      const invalidItems = validItems.filter(
        (item) =>
          !item.inventoryType ||
          !['paper', 'plastic', 'stones', 'tape'].includes(item.inventoryType),
      );

      if (invalidItems.length > 0) {
        showError(
          'Validation Error',
          'All items must have a valid inventory type selected.',
        );
        setLoading(false);
        return;
      }

      // For mixed inventory types, we'll use 'mixed' as the main type
      const uniqueTypes = [
        ...new Set(validItems.map((item) => item.inventoryType)),
      ];
      const mainInventoryType =
        uniqueTypes.length === 1 ? uniqueTypes[0] : 'mixed';

      const payload = {
        entryType,
        inventoryType: mainInventoryType,
        supplierName: entryType === 'purchase' ? selectedSupplier : undefined,
        billNumber: entryType === 'purchase' ? billNumber : undefined,
        billDate: entryType === 'purchase' ? billDate : undefined,
        items: validItems,
        totalAmount: totalAmount ? parseFloat(totalAmount) : undefined,
        notes,
        source: entryType === 'return' ? source : undefined,
        sourceOrderId:
          entryType === 'return' && source === 'order'
            ? sourceOrderId
            : undefined,
        sourceDescription:
          entryType === 'return' && source === 'other'
            ? sourceDescription
            : undefined,
      };

      // Debug logging
      console.log('Submitting payload:', payload);
      console.log('Valid items:', validItems);

      const response = await authenticatedFetch('/api/inventory-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await safeJsonParse<{ success: boolean; message?: string }>(
        response,
      );

      if (data.success) {
        showSuccess('Success', 'Inventory entry created successfully');
        onSuccess();
        handleClose();
      } else {
        showError('Error', data.message || 'Failed to create inventory entry');
      }
    } catch (error) {
      console.error('Error creating inventory entry:', error);
      showError('Error', 'Failed to create inventory entry');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEntryType('purchase');
    setSelectedSupplier('');
    setBillNumber('');
    setBillDate('');
    setItems([
      {
        inventoryType: '',
        itemId: '',
        itemName: '',
        quantity: 1,
        unit: 'pcs',
      },
    ]);
    setTotalAmount('');
    setNotes('');
    setSource('order');
    setSourceOrderId('');
    setSourceDescription('');
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleClose}
    >
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Inventory</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* Entry Type and Bill Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entry Type</Label>
              <Select
                value={entryType}
                onValueChange={(value: 'purchase' | 'return') =>
                  setEntryType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">
                    Purchase from Supplier
                  </SelectItem>
                  <SelectItem value="return">
                    Return/Add Back to Inventory
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {entryType === 'purchase' && (
              <div className="space-y-2">
                <Label>Bill Date *</Label>
                <Input
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          {/* Purchase-specific fields */}
          {entryType === 'purchase' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Input
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  placeholder="Enter supplier name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Bill Number *</Label>
                <Input
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                  placeholder="Enter bill number"
                  required
                />
              </div>
            </div>
          )}

          {/* Return-specific fields */}
          {entryType === 'return' && (
            <>
              <div className="space-y-2">
                <Label>Source</Label>
                <Select
                  value={source}
                  onValueChange={(value: 'order' | 'other') => setSource(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order">From Order</SelectItem>
                    <SelectItem value="other">Other Source</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {source === 'order' && (
                <div className="space-y-2">
                  <Label>Select Order</Label>
                  <Select
                    value={sourceOrderId}
                    onValueChange={setSourceOrderId}
                    disabled={loadingOrders}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an order" />
                    </SelectTrigger>
                    <SelectContent>
                      {orders.map((order) => (
                        <SelectItem
                          key={order._id}
                          value={order._id}
                        >
                          {order.customerName} - {order.type} -{' '}
                          {new Date(order.createdAt).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {source === 'other' && (
                <div className="space-y-2">
                  <Label>Source Description *</Label>
                  <Input
                    value={sourceDescription}
                    onChange={(e) => setSourceDescription(e.target.value)}
                    placeholder="Describe the source of items"
                    required
                  />
                </div>
              )}
            </>
          )}

          {/* Items Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItemRow}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="space-y-4 p-6 border rounded-lg"
                >
                  {/* Item Row Layout */}
                  <div className="space-y-4">
                    {/* First Row: Inventory Type and Item */}
                    <div className="flex gap-4 items-end">
                      <div className="space-y-1 flex-1">
                        <Label>Inventory Type *</Label>
                        <TypeableSelect
                          value={item.inventoryType}
                          onChange={(value) =>
                            updateItem(index, 'inventoryType', value)
                          }
                          options={[
                            { value: 'stones', label: 'Stones' },
                            { value: 'paper', label: 'Paper' },
                            { value: 'plastic', label: 'Plastic' },
                            { value: 'tape', label: 'Tape' },
                          ]}
                          placeholder="Select inventory type"
                          loading={loadingInventory}
                        />
                      </div>

                      <div className="space-y-1 flex-1">
                        <Label>Item *</Label>
                        <TypeableSelect
                          value={item.itemId}
                          onChange={(value) =>
                            updateItem(index, 'itemId', value)
                          }
                          options={inventoryItems.map((inventoryItem) => ({
                            value: inventoryItem._id,
                            label: inventoryItem.name,
                          }))}
                          placeholder="Select item"
                          disabled={!item.inventoryType}
                          loading={loadingInventory}
                        />
                      </div>

                      <div className="space-y-1 w-24">
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min={item.inventoryType === 'stones' ? '0.1' : '1'}
                          step={item.inventoryType === 'stones' ? '0.01' : '1'}
                          value={item.quantity}
                          onChange={(e) => {
                            const value =
                              parseFloat(e.target.value) ||
                              (item.inventoryType === 'stones' ? 0.1 : 1);
                            const minValue =
                              item.inventoryType === 'stones' ? 0.1 : 1;
                            if (value >= minValue) {
                              const roundedValue =
                                item.inventoryType === 'stones'
                                  ? Math.round(value * 100) / 100 // Round to 2 decimal places for stones
                                  : value;
                              updateItem(index, 'quantity', roundedValue);
                            }
                          }}
                          placeholder="Enter quantity"
                          required
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-sm text-white-600 px-3 py-2 rounded-md border">
                          Unit: {item.unit}
                        </div>
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeItemRow(index)}
                            className="h-10 w-10 p-0 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional fields */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Total Amount</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              loading={loading}
              loadingText="Creating..."
            >
              Create Entry
            </LoadingButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
