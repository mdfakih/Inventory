'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SafeImage } from '@/components/ui/safe-image';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { LoadingButton } from '@/components/ui/loading-button';
import { EmptyState } from '@/components/ui/empty-state';
import { useSnackbarHelpers } from '@/components/ui/snackbar';
import { useAuth } from '@/lib/auth-context';
import { authenticatedFetch } from '@/lib/utils';
import { Upload, X, Edit, Trash2, Eye, Plus, Palette } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

interface Stone {
  _id: string;
  name: string;
  number: string;
  color: string;
  size: string;
  quantity: number;
  unit: string;
  inventoryType: 'internal' | 'out';
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Design {
  _id: string;
  name: string;
  number: string;
  imageUrl?: string;
  prices: Array<{
    currency: '₹' | '$';
    price: number;
  }>;
  defaultStones: Array<{
    stoneId: { _id: string; name: string; inventoryType: 'internal' | 'out' };
    quantity: number;
  }>;
  createdBy: { name: string; email: string };
  updatedBy?: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  number: string;
  imageUrl: string;
  prices: Array<{
    currency: '₹' | '$';
    price: number;
  }>;
  defaultStones: Array<{
    stoneId: string;
    quantity: number;
  }>;
}

export default function DesignsPage() {
  // Helper function to ensure proper typing for price updates
  const updatePrices = (
    prices: Array<{ currency: string; price: number }>,
  ): Array<{ currency: '₹' | '$'; price: number }> => {
    return prices.map((p) => ({
      currency: p.currency as '₹' | '$',
      price: p.price,
    }));
  };

  const [designs, setDesigns] = useState<Design[]>([]);
  const [stones, setStones] = useState<Stone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    number: '',
    imageUrl: '',
    prices: [],
    defaultStones: [],
  });
  const [editFormData, setEditFormData] = useState<FormData>({
    name: '',
    number: '',
    imageUrl: '',
    prices: [],
    defaultStones: [],
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [sortBy] = useState('createdAt');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
  const { showSuccess, showError } = useSnackbarHelpers();
  const { loading: authLoading, isAuthenticated } = useAuth();

  const fetchUser = useCallback(async () => {
    try {
      const response = await authenticatedFetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
        }
      } else if (response.status === 401) {
        // Don't log error for 401 - let auth context handle it
        console.log('User authentication failed');
      } else {
        console.error(
          'Error fetching user:',
          response.status,
          response.statusText,
        );
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }, []);

  const fetchDesigns = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        const response = await authenticatedFetch(
          `/api/designs?page=${currentPage}&limit=${itemsPerPage}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setDesigns(data.data);
            setTotalPages(data.pagination.pages);
            setTotalItems(data.pagination.total);
          } else {
            showError(
              'Data Loading Error',
              data.message || 'Failed to load designs data.',
            );
          }
        } else if (response.status === 401) {
          // Don't show error for 401 - let auth context handle it
          console.log('Authentication failed while fetching designs');
        } else {
          showError(
            'Data Loading Error',
            `Failed to load designs data. Status: ${response.status}`,
          );
        }
      } catch (error) {
        console.error('Error fetching designs:', error);
        // Only show error if it's not an auth-related issue
        showError('Data Loading Error', 'Failed to load designs data.');
      } finally {
        setLoading(false);
        if (isRefresh) {
          setRefreshing(false);
        }
      }
    },
    [currentPage, itemsPerPage, sortBy, sortOrder, showError],
  );

  const fetchStones = useCallback(async () => {
    try {
      const [internalStonesRes, outStonesRes] = await Promise.all([
        authenticatedFetch('/api/inventory/stones?type=internal'),
        authenticatedFetch('/api/inventory/stones?type=out'),
      ]);

      // Combine both internal and out stones
      const allStones = [];

      if (internalStonesRes.ok) {
        const internalStonesData = await internalStonesRes.json();
        if (internalStonesData.success) {
          allStones.push(...internalStonesData.data);
        }
      } else if (internalStonesRes.status === 401) {
        console.log('Authentication failed while fetching internal stones');
      }

      if (outStonesRes.ok) {
        const outStonesData = await outStonesRes.json();
        if (outStonesData.success) {
          allStones.push(...outStonesData.data);
        }
      } else if (outStonesRes.status === 401) {
        console.log('Authentication failed while fetching out stones');
      }

      setStones(allStones);
    } catch (error) {
      console.error('Error fetching stones:', error);
      // Only show error if it's not an auth-related issue
      showError('Data Loading Error', 'Failed to load stones data.');
    }
  }, [showError]);

  const visibleIds = designs.map((d) => d._id);
  const areAllVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const someVisibleSelected =
    visibleIds.some((id) => selectedIds.includes(id)) && !areAllVisibleSelected;

  const toggleRowSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const visibleSet = new Set(visibleIds);
      const others = prev.filter((id) => !visibleSet.has(id));
      if (areAllVisibleSelected) {
        return others; // unselect all visible, keep others
      }
      return [...others, ...visibleIds];
    });
  };

  const openBulkDeleteDialog = () => setIsBulkDialogOpen(true);
  const closeBulkDeleteDialog = () => setIsBulkDialogOpen(false);

  const handleBulkDelete = async () => {
    const idsToDelete = selectedIds;
    if (idsToDelete.length < 1) return;
    setIsBulkDeleting(true);
    try {
      const response = await authenticatedFetch('/api/designs/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsToDelete }),
      });
      const data = await response.json();
      if (data.success) {
        showSuccess(
          'Designs Deleted',
          `${
            data.deletedCount || idsToDelete.length
          } designs deleted successfully.`,
        );
        setSelectedIds([]);
        await fetchDesigns(true);
        setIsBulkDialogOpen(false);
      } else {
        showError(
          'Bulk Delete Failed',
          data.message || 'Failed to delete selected designs.',
        );
      }
    } catch (error) {
      console.error('Error bulk deleting designs:', error);
      showError('Network Error', 'Failed to delete designs. Please try again.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  useEffect(() => {
    // Only fetch data when authentication is ready and user is authenticated
    if (!authLoading && isAuthenticated) {
      fetchDesigns();
      fetchStones();
      fetchUser();
    } else if (!authLoading && !isAuthenticated) {
      // If not authenticated, clear any existing data
      setDesigns([]);
      setStones([]);
      setUser(null);
    }
    // Functions are stable due to useCallback with proper dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authLoading,
    isAuthenticated,
    currentPage,
    itemsPerPage,
    sortBy,
    sortOrder,
  ]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleImageUpload = async (
    file: File,
    retryCount = 0,
    isEdit = false,
  ) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      // Validate file before upload
      if (!file.type.startsWith('image/')) {
        showError(
          'Invalid File Type',
          'Please select an image file (PNG, JPG, GIF).',
        );
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showError('File Too Large', 'File size must be less than 5MB.');
        return;
      }

      if (file.size === 0) {
        showError('Empty File', 'The selected file is empty.');
        return;
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      const formData = new FormData();
      formData.append('file', file);

      const response = await authenticatedFetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();
      if (data.success) {
        showSuccess(
          'Image Uploaded',
          'Design image has been uploaded successfully.',
        );

        if (isEdit) {
          setEditFormData((prev) => ({ ...prev, imageUrl: data.data.url }));
          // Reset edit file input after successful upload
          if (editFileInputRef.current) {
            editFileInputRef.current.value = '';
          }
        } else {
          setFormData((prev) => ({ ...prev, imageUrl: data.data.url }));
          // Reset file input after successful upload
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      } else {
        // Retry logic for network errors
        if (
          retryCount < 2 &&
          (response.status >= 500 || response.status === 408)
        ) {
          console.log(`Upload failed, retrying... (attempt ${retryCount + 1})`);
          setTimeout(() => {
            handleImageUpload(file, retryCount + 1, isEdit);
          }, 1000 * (retryCount + 1)); // Exponential backoff
          return;
        }

        showError('Upload Failed', data.message || 'Failed to upload image.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);

      // Retry logic for network errors
      if (retryCount < 2) {
        console.log(`Network error, retrying... (attempt ${retryCount + 1})`);
        setTimeout(() => {
          handleImageUpload(file, retryCount + 1, isEdit);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }

      showError(
        'Network Error',
        'Failed to upload image. Please check your connection and try again.',
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that at least one stone is selected
    const validStones = formData.defaultStones.filter(
      (stone) => stone.stoneId && stone.stoneId.trim() !== '',
    );
    if (validStones.length === 0) {
      showError(
        'Validation Error',
        'At least one stone must be selected for the design. Please add a stone before creating the design.',
      );
      return;
    }

    console.log('data', formData);
    setIsCreating(true);
    try {
      const response = await authenticatedFetch('/api/designs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        showSuccess(
          'Design Created',
          'New design has been created successfully.',
        );
        setIsCreateDialogOpen(false);
        setFormData({
          name: '',
          number: '',
          imageUrl: '',
          prices: [],
          defaultStones: [],
        });
        await fetchDesigns(true);
      } else {
        showError(
          'Creation Failed',
          data.message || 'Failed to create design.',
        );
      }
    } catch (error) {
      console.error('Error creating design:', error);
      showError('Network Error', 'Failed to create design. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDesign) return;

    // Validate that at least one stone is selected
    const validStones = editFormData.defaultStones.filter(
      (stone) => stone.stoneId && stone.stoneId.trim() !== '',
    );
    if (validStones.length === 0) {
      showError(
        'Validation Error',
        'At least one stone must be selected for the design. Please add a stone before updating the design.',
      );
      return;
    }

    setIsUpdating(true);
    try {
      const response = await authenticatedFetch(
        `/api/designs/${selectedDesign._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editFormData),
        },
      );

      const data = await response.json();
      if (data.success) {
        showSuccess('Design Updated', 'Design has been updated successfully.');
        setIsEditDialogOpen(false);
        setSelectedDesign(null);
        await fetchDesigns(true);
      } else {
        showError('Update Failed', data.message || 'Failed to update design.');
      }
    } catch (error) {
      console.error('Error updating design:', error);
      showError('Network Error', 'Failed to update design. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (designId: string) => {
    if (!confirm('Are you sure you want to delete this design?')) return;

    setIsDeleting(designId);
    try {
      const response = await authenticatedFetch(`/api/designs/${designId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showSuccess('Design Deleted', 'Design has been deleted successfully.');
        await fetchDesigns(true);
      } else {
        showError(
          'Deletion Failed',
          data.message || 'Failed to delete design.',
        );
      }
    } catch (error) {
      console.error('Error deleting design:', error);
      showError('Network Error', 'Failed to delete design. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const openEditDialog = (design: Design) => {
    setSelectedDesign(design);
    setEditFormData({
      name: design.name,
      number: design.number,
      imageUrl: design.imageUrl || '',
      prices:
        design.prices?.map((price) => ({
          currency: price.currency,
          price: price.price,
        })) || [],
      defaultStones:
        design.defaultStones?.map((stone) => ({
          stoneId: stone.stoneId?._id || '',
          quantity: stone.quantity,
        })) || [],
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (design: Design) => {
    setSelectedDesign(design);
    setIsViewDialogOpen(true);
  };

  const addDefaultStone = () => {
    setFormData((prev) => ({
      ...prev,
      defaultStones: [...prev.defaultStones, { stoneId: '', quantity: 0 }],
    }));
  };

  const removeDefaultStone = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      defaultStones: prev.defaultStones.filter((_, i) => i !== index),
    }));
  };

  const updateDefaultStone = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      defaultStones: prev.defaultStones.map((stone, i) =>
        i === index ? { ...stone, [field]: value } : stone,
      ),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Designs Management</h1>
          <p className="text-gray-600">
            Manage design templates and configurations
          </p>
        </div>
        <div className="flex items-center gap-4">
          {user?.role === 'admin' && selectedIds.length > 0 && (
            <Button
              variant="destructive"
              onClick={openBulkDeleteDialog}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedIds.length})
            </Button>
          )}
          {refreshing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner size="sm" />
              <span>Refreshing...</span>
            </div>
          )}
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Design
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Design</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleCreateSubmit}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Design Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number">Design Number</Label>
                    <Input
                      id="number"
                      value={formData.number}
                      onChange={(e) =>
                        setFormData({ ...formData, number: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Pricing</Label>
                  <div className="space-y-3">
                    {formData.prices.map((priceItem, index) => (
                      <div
                        key={index}
                        className="flex gap-2 items-end"
                      >
                        <div className="flex-1">
                          <Label htmlFor={`currency-${index}`}>Currency</Label>
                          <Select
                            value={priceItem.currency}
                            onValueChange={(value) => {
                              const newPrices = [...formData.prices];
                              newPrices[index] = {
                                ...priceItem,
                                currency: value as '₹' | '$',
                              };
                              setFormData({
                                ...formData,
                                prices: updatePrices(newPrices),
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem
                                value="₹"
                                disabled={formData.prices.some(
                                  (p, i) => i !== index && p.currency === '₹',
                                )}
                              >
                                ₹ (Indian Rupee)
                              </SelectItem>
                              <SelectItem
                                value="$"
                                disabled={formData.prices.some(
                                  (p, i) => i !== index && p.currency === '$',
                                )}
                              >
                                $ (US Dollar)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <Label htmlFor={`price-${index}`}>Price</Label>
                          <Input
                            id={`price-${index}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={priceItem.price}
                            onChange={(e) => {
                              const newPrices = [...formData.prices];
                              newPrices[index] = {
                                ...priceItem,
                                price: parseFloat(e.target.value) || 0,
                              };
                              setFormData({
                                ...formData,
                                prices: updatePrices(newPrices),
                              });
                            }}
                            placeholder="Enter price"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newPrices = formData.prices.filter(
                              (_, i) => i !== index,
                            );
                            setFormData({
                              ...formData,
                              prices: updatePrices(newPrices),
                            });
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const usedCurrencies = formData.prices.map(
                          (p) => p.currency,
                        );
                        const availableCurrency = usedCurrencies.includes('₹')
                          ? '$'
                          : '₹';
                        const newPrices = [
                          ...formData.prices,
                          { currency: availableCurrency, price: 0 },
                        ];
                        setFormData({
                          ...formData,
                          prices: updatePrices(newPrices),
                        });
                      }}
                      disabled={formData.prices.length >= 2}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Price
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Design Image{' '}
                    <span className="text-sm text-gray-500">(Optional)</span>
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {formData.imageUrl ? (
                      <div className="space-y-2">
                        <SafeImage
                          src={formData.imageUrl}
                          alt="Design preview"
                          width={128}
                          height={128}
                          className="mx-auto max-h-32 object-contain"
                          fallbackText="Design preview"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setFormData({ ...formData, imageUrl: '' })
                          }
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remove Image
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="space-y-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                          >
                            {uploading ? (
                              <>
                                <Spinner
                                  size="sm"
                                  className="mr-2"
                                />
                                Uploading... {Math.round(uploadProgress)}%
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Image
                              </>
                            )}
                          </Button>
                          {uploading && (
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          PNG, JPG, GIF up to 5MB (Optional)
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(file);
                        }
                        // Reset the input value to allow selecting the same file again
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Default Stones</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDefaultStone}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Stone
                    </Button>
                  </div>
                  {formData.defaultStones.map((stone, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-3 gap-4 items-end"
                    >
                      <div>
                        <Label>Stone</Label>
                        <Select
                          value={stone.stoneId}
                          onValueChange={(value) =>
                            updateDefaultStone(index, 'stoneId', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select stone" />
                          </SelectTrigger>
                          <SelectContent>
                            {stones.map((s) => (
                              <SelectItem
                                key={s._id}
                                value={s._id}
                              >
                                {s.name} (
                                {s.inventoryType === 'out'
                                  ? 'Out Job'
                                  : 'Internal'}
                                )
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Quantity (g)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={stone.quantity}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            const roundedValue = Math.round(value * 100) / 100; // Round to 2 decimal places
                            updateDefaultStone(index, 'quantity', roundedValue);
                          }}
                          min="0.1"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeDefaultStone(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <LoadingButton
                    type="submit"
                    loading={isCreating}
                    loadingText="Creating..."
                  >
                    Create Design
                  </LoadingButton>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {designs.length === 0 ? (
            <EmptyState
              icon={Palette}
              title="No Designs Found"
              description="Get started by creating your first design. Designs will appear here once they are created."
              action={
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Design
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={areAllVisibleSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someVisibleSelected;
                      }}
                      onChange={toggleSelectAllVisible}
                    />
                  </TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Default Stones</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {designs.map((design) => (
                  <TableRow
                    key={design._id}
                    data-state={
                      selectedIds.includes(design._id) ? 'selected' : undefined
                    }
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        aria-label={`Select ${design.name}`}
                        checked={selectedIds.includes(design._id)}
                        onChange={() => toggleRowSelection(design._id)}
                      />
                    </TableCell>
                    <TableCell>
                      {design.imageUrl ? (
                        <SafeImage
                          src={design.imageUrl}
                          alt={design.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 object-cover rounded"
                          fallbackText="No Image"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                          No Image
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{design.name}</TableCell>
                    <TableCell>{design.number}</TableCell>
                    <TableCell>
                      {design.prices?.length > 0 ? (
                        <div className="space-y-1">
                          {design.prices.map((price, index) => (
                            <div
                              key={index}
                              className="font-medium"
                            >
                              {price.currency}{' '}
                              {price.price % 1 === 0
                                ? price.price.toFixed(0)
                                : price.price.toFixed(2)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {design.defaultStones?.length > 0 ? (
                        <div className="space-y-1">
                          {design.defaultStones.map((stone, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="mr-1"
                            >
                              {stone.stoneId?.name} (
                              {stone.stoneId?.inventoryType === 'out'
                                ? 'Out Job'
                                : 'Internal'}
                              ): {stone.quantity}g
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">No default stones</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {new Date(design.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewDialog(design)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(design)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {user?.role === 'admin' && (
                          <LoadingButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(design._id)}
                            loading={isDeleting === design._id}
                            loadingText=""
                          >
                            <Trash2 className="h-4 w-4" />
                          </LoadingButton>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </CardContent>
      </Card>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={isBulkDialogOpen}
        onOpenChange={setIsBulkDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedIds.length === 1
                ? 'Delete Design'
                : 'Delete Selected Designs'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete {selectedIds.length}{' '}
              {selectedIds.length === 1 ? 'design' : 'designs'}? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={closeBulkDeleteDialog}
                disabled={isBulkDeleting}
              >
                Cancel
              </Button>
              <LoadingButton
                onClick={handleBulkDelete}
                loading={isBulkDeleting}
                loadingText="Deleting..."
                variant="destructive"
              >
                Delete
              </LoadingButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Design</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleEditSubmit}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Design Name</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-number">Design Number</Label>
                <Input
                  id="edit-number"
                  value={editFormData.number}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, number: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Pricing</Label>
              <div className="space-y-3">
                {editFormData.prices.map((priceItem, index) => (
                  <div
                    key={index}
                    className="flex gap-2 items-end"
                  >
                    <div className="flex-1">
                      <Label htmlFor={`edit-currency-${index}`}>Currency</Label>
                      <Select
                        value={priceItem.currency}
                        onValueChange={(value) => {
                          const newPrices = [...editFormData.prices];
                          newPrices[index] = {
                            ...priceItem,
                            currency: value as '₹' | '$',
                          };
                          setEditFormData({
                            ...editFormData,
                            prices: updatePrices(newPrices),
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            value="₹"
                            disabled={editFormData.prices.some(
                              (p, i) => i !== index && p.currency === '₹',
                            )}
                          >
                            ₹ (Indian Rupee)
                          </SelectItem>
                          <SelectItem
                            value="$"
                            disabled={editFormData.prices.some(
                              (p, i) => i !== index && p.currency === '$',
                            )}
                          >
                            $ (US Dollar)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`edit-price-${index}`}>Price</Label>
                      <Input
                        id={`edit-price-${index}`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={priceItem.price}
                        onChange={(e) => {
                          const newPrices = [...editFormData.prices];
                          newPrices[index] = {
                            ...priceItem,
                            price: parseFloat(e.target.value) || 0,
                          };
                          setEditFormData({
                            ...editFormData,
                            prices: updatePrices(newPrices),
                          });
                        }}
                        placeholder="Enter price"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPrices = editFormData.prices.filter(
                          (_, i) => i !== index,
                        );
                        setEditFormData({
                          ...editFormData,
                          prices: updatePrices(newPrices),
                        });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const usedCurrencies = editFormData.prices.map(
                      (p) => p.currency,
                    );
                    const availableCurrency = usedCurrencies.includes('₹')
                      ? '$'
                      : '₹';
                    const newPrices = [
                      ...editFormData.prices,
                      { currency: availableCurrency, price: 0 },
                    ];
                    setEditFormData({
                      ...editFormData,
                      prices: updatePrices(newPrices),
                    });
                  }}
                  disabled={editFormData.prices.length >= 2}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Price
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Design Image{' '}
                <span className="text-sm text-gray-500">(Optional)</span>
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {editFormData.imageUrl ? (
                  <div className="space-y-2">
                    <SafeImage
                      src={editFormData.imageUrl}
                      alt="Design preview"
                      width={128}
                      height={128}
                      className="mx-auto max-h-32 object-contain"
                      fallbackText="Design preview"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditFormData({ ...editFormData, imageUrl: '' })
                      }
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => editFileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <>
                            <Spinner
                              size="sm"
                              className="mr-2"
                            />
                            Uploading... {Math.round(uploadProgress)}%
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Image
                          </>
                        )}
                      </Button>
                      {uploading && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      PNG, JPG, GIF up to 5MB (Optional)
                    </p>
                  </div>
                )}
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file, 0, true);
                    }
                    // Reset the input value to allow selecting the same file again
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Default Stones</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setEditFormData((prev) => ({
                      ...prev,
                      defaultStones: [
                        ...prev.defaultStones,
                        { stoneId: '', quantity: 0 },
                      ],
                    }))
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stone
                </Button>
              </div>
              {editFormData.defaultStones.map((stone, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-4 items-end"
                >
                  <div>
                    <Label>Stone</Label>
                    <Select
                      value={stone.stoneId}
                      onValueChange={(value) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          defaultStones: prev.defaultStones.map((s, i) =>
                            i === index ? { ...s, stoneId: value } : s,
                          ),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stone" />
                      </SelectTrigger>
                      <SelectContent>
                        {stones.map((s) => (
                          <SelectItem
                            key={s._id}
                            value={s._id}
                          >
                            {s.name} (
                            {s.inventoryType === 'out' ? 'Out Job' : 'Internal'}
                            )
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quantity (g)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={stone.quantity}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        const roundedValue = Math.round(value * 100) / 100; // Round to 2 decimal places
                        setEditFormData((prev) => ({
                          ...prev,
                          defaultStones: prev.defaultStones.map((s, i) =>
                            i === index
                              ? {
                                  ...s,
                                  quantity: roundedValue,
                                }
                              : s,
                          ),
                        }));
                      }}
                      min="0.1"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEditFormData((prev) => ({
                        ...prev,
                        defaultStones: prev.defaultStones.filter(
                          (_, i) => i !== index,
                        ),
                      }))
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                loading={isUpdating}
                loadingText="Updating..."
              >
                Update Design
              </LoadingButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Design Details</DialogTitle>
          </DialogHeader>
          {selectedDesign && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Design Name</Label>
                  <p>{selectedDesign.name}</p>
                </div>
                <div>
                  <Label className="font-semibold">Design Number</Label>
                  <p>{selectedDesign.number}</p>
                </div>
              </div>
              <div>
                <Label className="font-semibold">Pricing</Label>
                {selectedDesign.prices?.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {selectedDesign.prices.map((priceItem, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <span className="font-medium">
                          {priceItem.currency}{' '}
                          {priceItem.price % 1 === 0
                            ? priceItem.price.toFixed(0)
                            : priceItem.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 mt-2">No prices set</p>
                )}
              </div>
              <div>
                <Label className="font-semibold">Design Image</Label>
                {selectedDesign.imageUrl ? (
                  <SafeImage
                    src={selectedDesign.imageUrl}
                    alt={selectedDesign.name}
                    width={192}
                    height={192}
                    className="mt-2 max-h-48 object-contain rounded"
                    fallbackText="No image available"
                  />
                ) : (
                  <div className="mt-2 w-48 h-48 bg-gray-100 rounded flex items-center justify-center text-gray-500">
                    No image available
                  </div>
                )}
              </div>
              <div>
                <Label className="font-semibold">Default Stones</Label>
                {selectedDesign.defaultStones?.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {selectedDesign.defaultStones.map((stone, index) => (
                      <div
                        key={index}
                        className="flex justify-between"
                      >
                        <span>
                          {stone.stoneId?.name} (
                          {stone.stoneId?.inventoryType === 'out'
                            ? 'Out Job'
                            : 'Internal'}
                          )
                        </span>
                        <span>{stone.quantity}g</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 mt-2">No default stones</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Created By</Label>
                  <p>{selectedDesign.createdBy?.name || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Last Updated By</Label>
                  <p>{selectedDesign.updatedBy?.name || 'Not updated'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
