'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SpinnerPage } from '@/components/ui/spinner';
import { LoadingButton } from '@/components/ui/loading-button';
import { EmptyState } from '@/components/ui/empty-state';
import { useSnackbarHelpers } from '@/components/ui/snackbar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import EditUserForm from '@/components/masters/edit-user-form';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Plus,
  Users,
  Package,
  Palette,
  Settings,
  Lock,
  Unlock,
  Key,
  Info,
  Edit,
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Pagination } from '@/components/ui/pagination';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  status: 'active' | 'blocked';
  createdAt: string;
  passwordResetRequest?: {
    requested: boolean;
    requestedAt?: string;
    approved: boolean;
    approvedAt?: string;
    approvedBy?: string;
  };
}

interface PasswordResetRequest {
  _id: string;
  name: string;
  email: string;
  passwordResetRequest: {
    requested: boolean;
    requestedAt: string;
    approved: boolean;
    approvedAt?: string;
    approvedBy?: string;
  };
  createdAt: string;
}

interface Stone {
  _id: string;
  name: string;
  number: string;
  color: string;
  size: string;
  quantity: number;
  unit: 'g' | 'kg';
}

interface Paper {
  _id: string;
  name: string;
  width: number;
  quantity: number;
  totalPieces: number;
  piecesPerRoll: number;
  weightPerPiece: number;
  inventoryType: 'internal' | 'out';
}

interface Plastic {
  _id: string;
  name: string;
  width: number;
  quantity: number;
}

interface Tape {
  _id: string;
  name: string;
  quantity: number;
}

export default function MastersPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [passwordResetRequests, setPasswordResetRequests] = useState<
    PasswordResetRequest[]
  >([]);
  const [stones, setStones] = useState<Stone[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [plastics, setPlastics] = useState<Plastic[]>([]);
  const [tapes, setTapes] = useState<Tape[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const router = useRouter();
  const { showSuccess, showError, showWarning } = useSnackbarHelpers();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const loadAllData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      // Load all master data
      const [
        usersRes,
        passwordResetRes,
        stonesRes,
        papersRes,
        plasticsRes,
        tapesRes,
      ] = await Promise.all([
        fetch(`/api/masters/users?page=${currentPage}&limit=${itemsPerPage}`),
        fetch('/api/auth/password-reset-requests'),
        fetch(`/api/inventory/stones?page=${currentPage}&limit=${itemsPerPage}`),
        fetch(`/api/inventory/paper?page=${currentPage}&limit=${itemsPerPage}`),
        fetch(`/api/inventory/plastic?page=${currentPage}&limit=${itemsPerPage}`),
        fetch(`/api/inventory/tape?page=${currentPage}&limit=${itemsPerPage}`),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.data || []);
        if (usersData.pagination) {
          setTotalPages(usersData.pagination.pages);
          setTotalItems(usersData.pagination.total);
        }
      }

      if (passwordResetRes.ok) {
        const passwordResetData = await passwordResetRes.json();
        setPasswordResetRequests(passwordResetData.data || []);
      }

      if (stonesRes.ok) {
        const stonesData = await stonesRes.json();
        setStones(stonesData.data || []);
      }

      if (papersRes.ok) {
        const papersData = await papersRes.json();
        setPapers(papersData.data || []);
      }

      if (plasticsRes.ok) {
        const plasticsData = await plasticsRes.json();
        setPlastics(plasticsData.data || []);
      }

      if (tapesRes.ok) {
        const tapesData = await tapesRes.json();
        setTapes(tapesData.data || []);
      }
    } catch (error) {
      console.error('Error loading master data:', error);
      showError('Data Loading Error', 'Failed to load master data.');
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      if (user?.role !== 'admin') {
        showError('Access Denied', 'Only administrators can access this page.');
        router.push('/dashboard');
        return;
      }

      loadAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, user?.role]);

  const [isTogglingStatus, setIsTogglingStatus] = useState<string | null>(null);

  const handleToggleUserStatus = async (
    userId: string,
    currentStatus: string,
  ) => {
    setIsTogglingStatus(userId);
    try {
      const response = await fetch(`/api/masters/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-status' }),
      });

      if (response.ok) {
        await response.json();
        showSuccess(
          'User Status Updated',
          `User has been ${
            currentStatus === 'active' ? 'blocked' : 'activated'
          } successfully.`,
        );
        await loadAllData(true);
      } else {
        showError('Update Failed', 'Failed to update user status.');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      showError(
        'Network Error',
        'Failed to update user status. Please try again.',
      );
    } finally {
      setIsTogglingStatus(null);
    }
  };

  const [isProcessingRequest, setIsProcessingRequest] = useState<string | null>(
    null,
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(
    null,
  );

  // Edit and delete states for master data
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
  const [editingPlastic, setEditingPlastic] = useState<Plastic | null>(null);
  const [editingTape, setEditingTape] = useState<Tape | null>(null);
  const [isEditPaperDialogOpen, setIsEditPaperDialogOpen] = useState(false);
  const [isEditPlasticDialogOpen, setIsEditPlasticDialogOpen] = useState(false);
  const [isEditTapeDialogOpen, setIsEditTapeDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleEditUser = (user: User) => {
    setSelectedUserForEdit(user);
    setIsEditDialogOpen(true);
  };

  // Edit handlers for master data
  const handleEditPaper = (paper: Paper) => {
    setEditingPaper(paper);
    setIsEditPaperDialogOpen(true);
  };

  const handleEditPlastic = (plastic: Plastic) => {
    setEditingPlastic(plastic);
    setIsEditPlasticDialogOpen(true);
  };

  const handleEditTape = (tape: Tape) => {
    setEditingTape(tape);
    setIsEditTapeDialogOpen(true);
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Delete handlers for master data
  const handleDeleteStone = async (stoneId: string) => {
    if (!confirm('Are you sure you want to delete this stone type?')) return;

    setIsDeleting(stoneId);
    try {
      const response = await fetch(`/api/masters/stones/${stoneId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showSuccess(
          'Stone Deleted',
          'Stone type has been deleted successfully.',
        );
        await loadAllData(true);
      } else {
        const data = await response.json();
        showError(
          'Delete Failed',
          data.message || 'Failed to delete stone type.',
        );
      }
    } catch (error) {
      console.error('Error deleting stone:', error);
      showError(
        'Network Error',
        'Failed to delete stone type. Please try again.',
      );
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeletePaper = async (paperId: string) => {
    if (!confirm('Are you sure you want to delete this paper type?')) return;

    setIsDeleting(paperId);
    try {
      const response = await fetch(`/api/masters/paper/${paperId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showSuccess(
          'Paper Deleted',
          'Paper type has been deleted successfully.',
        );
        await loadAllData(true);
      } else {
        const data = await response.json();
        showError(
          'Delete Failed',
          data.message || 'Failed to delete paper type.',
        );
      }
    } catch (error) {
      console.error('Error deleting paper:', error);
      showError(
        'Network Error',
        'Failed to delete paper type. Please try again.',
      );
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeletePlastic = async (plasticId: string) => {
    if (!confirm('Are you sure you want to delete this plastic type?')) return;

    setIsDeleting(plasticId);
    try {
      const response = await fetch(`/api/masters/plastic/${plasticId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showSuccess(
          'Plastic Deleted',
          'Plastic type has been deleted successfully.',
        );
        await loadAllData(true);
      } else {
        const data = await response.json();
        showError(
          'Delete Failed',
          data.message || 'Failed to delete plastic type.',
        );
      }
    } catch (error) {
      console.error('Error deleting plastic:', error);
      showError(
        'Network Error',
        'Failed to delete plastic type. Please try again.',
      );
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeleteTape = async (tapeId: string) => {
    if (!confirm('Are you sure you want to delete this tape type?')) return;

    setIsDeleting(tapeId);
    try {
      const response = await fetch(`/api/masters/tape/${tapeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showSuccess('Tape Deleted', 'Tape type has been deleted successfully.');
        await loadAllData(true);
      } else {
        const data = await response.json();
        showError(
          'Delete Failed',
          data.message || 'Failed to delete tape type.',
        );
      }
    } catch (error) {
      console.error('Error deleting tape:', error);
      showError(
        'Network Error',
        'Failed to delete tape type. Please try again.',
      );
    } finally {
      setIsDeleting(null);
    }
  };

  const handlePasswordResetRequest = async (
    userId: string,
    action: 'approve' | 'reject',
  ) => {
    setIsProcessingRequest(userId);
    try {
      const response = await fetch('/api/auth/password-reset-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });

      if (response.ok) {
        const data = await response.json();
        if (action === 'approve') {
          showSuccess(
            'Password Reset Approved',
            `New password: ${data.newPassword}. Please share this with the user securely.`,
          );
        } else {
          showWarning(
            'Request Rejected',
            'Password reset request has been rejected.',
          );
        }
        await loadAllData(true);
      } else {
        showError('Action Failed', 'Failed to process password reset request.');
      }
    } catch (error) {
      console.error('Error processing password reset request:', error);
      showError(
        'Network Error',
        'Failed to process request. Please try again.',
      );
    } finally {
      setIsProcessingRequest(null);
    }
  };

  if (loading) {
    return <SpinnerPage />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Access Denied
          </h2>
          <p className="text-muted-foreground">
            Only administrators can access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Master Management</h1>
        <p className="text-muted-foreground">
          Manage all master data and system configurations
        </p>
        {refreshing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Spinner size="sm" />
            <span>Refreshing...</span>
          </div>
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger
            value="users"
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger
            value="password-requests"
            className="flex items-center gap-2"
          >
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">Password Requests</span>
          </TabsTrigger>
          <TabsTrigger
            value="stones"
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Stones</span>
          </TabsTrigger>
          <TabsTrigger
            value="paper"
            className="flex items-center gap-2"
          >
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Paper</span>
          </TabsTrigger>
          <TabsTrigger
            value="plastic"
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Plastic</span>
          </TabsTrigger>
          <TabsTrigger
            value="tape"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Tape</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="users"
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage system users and their roles
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                    </DialogHeader>
                    <UserForm onSuccess={loadAllData} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No Users Found"
                  description="Get started by adding your first user. Users will appear here once they are created."
                  action={
                    <Button onClick={() => setActiveTab('users')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First User
                    </Button>
                  }
                />
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user._id}>
                            <TableCell className="font-medium">
                              {user.name}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  user.role === 'admin'
                                    ? 'default'
                                    : user.role === 'manager'
                                    ? 'secondary'
                                    : 'outline'
                                }
                              >
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  user.status === 'active'
                                    ? 'default'
                                    : 'destructive'
                                }
                              >
                                {user.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <LoadingButton
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleToggleUserStatus(
                                      user._id,
                                      user.status,
                                    )
                                  }
                                  loading={isTogglingStatus === user._id}
                                  loadingText=""
                                >
                                  {user.status === 'active' ? (
                                    <>
                                      <Lock className="h-4 w-4 mr-1" />
                                      Block
                                    </>
                                  ) : (
                                    <>
                                      <Unlock className="h-4 w-4 mr-1" />
                                      Unblock
                                    </>
                                  )}
                                </LoadingButton>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                    >
                                      <Key className="h-4 w-4 mr-1" />
                                      Change Password
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>
                                        Change Password for {user.name}
                                      </DialogTitle>
                                    </DialogHeader>
                                    <ChangePasswordForm
                                      userId={user._id}
                                      onSuccess={loadAllData}
                                    />
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="password-requests"
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Password Reset Requests</CardTitle>
                <CardDescription>
                  Manage pending password reset requests from users
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {passwordResetRequests.length === 0 ? (
                <EmptyState
                  icon={Key}
                  title="No Password Reset Requests"
                  description="There are no pending password reset requests at the moment."
                />
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Requested At</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {passwordResetRequests.map((request) => (
                          <TableRow key={request._id}>
                            <TableCell className="font-medium">
                              {request.name}
                            </TableCell>
                            <TableCell>{request.email}</TableCell>
                            <TableCell>
                              {new Date(
                                request.passwordResetRequest.requestedAt,
                              ).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <LoadingButton
                                  variant="default"
                                  size="sm"
                                  onClick={() =>
                                    handlePasswordResetRequest(
                                      request._id,
                                      'approve',
                                    )
                                  }
                                  loading={isProcessingRequest === request._id}
                                  loadingText="Approving..."
                                >
                                  Approve
                                </LoadingButton>
                                <LoadingButton
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handlePasswordResetRequest(
                                      request._id,
                                      'reject',
                                    )
                                  }
                                  loading={isProcessingRequest === request._id}
                                  loadingText="Rejecting..."
                                >
                                  Reject
                                </LoadingButton>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="stones"
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Stone Master Data</CardTitle>
                  <CardDescription>
                    Manage stone types and specifications
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Stone Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Stone Type</DialogTitle>
                    </DialogHeader>
                    <StoneForm onSuccess={loadAllData} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stones.map((stone) => (
                        <TableRow key={stone._id}>
                          <TableCell className="font-medium">
                            {stone.name}
                          </TableCell>
                          <TableCell>{stone.number}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{stone.color}</Badge>
                          </TableCell>
                          <TableCell>{stone.size}</TableCell>
                          <TableCell>{stone.unit}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              {user?.role === 'admin' && (
                                <LoadingButton
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteStone(stone._id)}
                                  loading={isDeleting === stone._id}
                                  loadingText=""
                                >
                                  Delete
                                </LoadingButton>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="paper"
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Paper Master Data</CardTitle>
                  <CardDescription>
                    Manage paper types and specifications with custom width and
                    pieces per roll
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Paper Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Paper Type</DialogTitle>
                    </DialogHeader>
                    <PaperForm onSuccess={loadAllData} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {papers.length === 0 ? (
                <EmptyState
                  icon={Palette}
                  title="No Paper Types Found"
                  description="Get started by adding your first paper type. Paper types will appear here once they are created."
                  action={
                    <Button onClick={() => setActiveTab('paper')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Paper Type
                    </Button>
                  }
                />
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Width (inches)</TableHead>
                          <TableHead>Pieces per Roll</TableHead>
                          <TableHead>Weight per Piece (g)</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {papers.map((paper) => (
                          <TableRow key={paper._id}>
                            <TableCell className="font-medium">
                              {paper.name}
                            </TableCell>
                            <TableCell>{paper.width}&quot;</TableCell>
                            <TableCell>{paper.piecesPerRoll}</TableCell>
                            <TableCell>{paper.weightPerPiece}g</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {paper.inventoryType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditPaper(paper)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                {user?.role === 'admin' && (
                                  <LoadingButton
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeletePaper(paper._id)}
                                    loading={isDeleting === paper._id}
                                    loadingText=""
                                  >
                                    Delete
                                  </LoadingButton>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="plastic"
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Plastic Master Data</CardTitle>
                  <CardDescription>
                    Manage plastic types and specifications with custom width
                    values
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Plastic Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Plastic Type</DialogTitle>
                    </DialogHeader>
                    <PlasticForm onSuccess={loadAllData} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {plastics.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No Plastic Types Found"
                  description="Get started by adding your first plastic type. Plastic types will appear here once they are created."
                  action={
                    <Button onClick={() => setActiveTab('plastic')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Plastic Type
                    </Button>
                  }
                />
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Width (inches)</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plastics.map((plastic) => (
                          <TableRow key={plastic._id}>
                            <TableCell className="font-medium">
                              {plastic.name}
                            </TableCell>
                            <TableCell>{plastic.width}&quot;</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditPlastic(plastic)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                {user?.role === 'admin' && (
                                  <LoadingButton
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                      handleDeletePlastic(plastic._id)
                                    }
                                    loading={isDeleting === plastic._id}
                                    loadingText=""
                                  >
                                    Delete
                                  </LoadingButton>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="tape"
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Tape Master Data</CardTitle>
                  <CardDescription>Manage tape specifications</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tape Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Tape Type</DialogTitle>
                    </DialogHeader>
                    <TapeForm onSuccess={loadAllData} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {tapes.length === 0 ? (
                <EmptyState
                  icon={Settings}
                  title="No Tape Types Found"
                  description="Get started by adding your first tape type. Tape types will appear here once they are created."
                  action={
                    <Button onClick={() => setActiveTab('tape')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Tape Type
                    </Button>
                  }
                />
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tapes.map((tape) => (
                          <TableRow key={tape._id}>
                            <TableCell className="font-medium">
                              {tape.name}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditTape(tape)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                {user?.role === 'admin' && (
                                  <LoadingButton
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteTape(tape._id)}
                                    loading={isDeleting === tape._id}
                                    loadingText=""
                                  >
                                    Delete
                                  </LoadingButton>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {selectedUserForEdit && (
            <EditUserForm
              user={selectedUserForEdit}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setSelectedUserForEdit(null);
                loadAllData();
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedUserForEdit(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Paper Dialog */}
      <Dialog
        open={isEditPaperDialogOpen}
        onOpenChange={setIsEditPaperDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Paper Type</DialogTitle>
          </DialogHeader>
          {editingPaper && (
            <EditPaperForm
              paper={editingPaper}
              onSuccess={() => {
                setIsEditPaperDialogOpen(false);
                setEditingPaper(null);
                loadAllData();
              }}
              onCancel={() => {
                setIsEditPaperDialogOpen(false);
                setEditingPaper(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Plastic Dialog */}
      <Dialog
        open={isEditPlasticDialogOpen}
        onOpenChange={setIsEditPlasticDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Plastic Type</DialogTitle>
          </DialogHeader>
          {editingPlastic && (
            <EditPlasticForm
              plastic={editingPlastic}
              onSuccess={() => {
                setIsEditPlasticDialogOpen(false);
                setEditingPlastic(null);
                loadAllData();
              }}
              onCancel={() => {
                setIsEditPlasticDialogOpen(false);
                setEditingPlastic(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Tape Dialog */}
      <Dialog
        open={isEditTapeDialogOpen}
        onOpenChange={setIsEditTapeDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Tape Type</DialogTitle>
          </DialogHeader>
          {editingTape && (
            <EditTapeForm
              tape={editingTape}
              onSuccess={() => {
                setIsEditTapeDialogOpen(false);
                setEditingTape(null);
                loadAllData();
              }}
              onCancel={() => {
                setIsEditTapeDialogOpen(false);
                setEditingTape(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Form components for each master type
function UserForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as 'admin' | 'manager' | 'employee',
  });
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useSnackbarHelpers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/masters/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showSuccess('User Created', 'New user has been added successfully.');
        onSuccess();
        setFormData({ name: '', email: '', password: '', role: 'employee' });
      } else {
        const data = await response.json();
        showError('Creation Failed', data.message || 'Failed to create user.');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showError('Network Error', 'Failed to create user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="mt-1"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="mt-1"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">
          Password <span className="text-red-500">*</span>
        </Label>
        <PasswordInput
          id="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
          className="mt-1"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="role">
            Role <span className="text-red-500">*</span>
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-2">
                  <p className="font-semibold">Role Permissions:</p>
                  <div className="space-y-1 text-xs">
                    <p>
                      <strong>Admin:</strong> Full access - can delete anything
                      and everything
                    </p>
                    <p>
                      <strong>Manager:</strong> Limited access - cannot delete
                      records
                    </p>
                    <p>
                      <strong>Employee:</strong> Basic access - view and update
                      only
                    </p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Select
          value={formData.role}
          onValueChange={(value: 'admin' | 'manager' | 'employee') =>
            setFormData({ ...formData, role: value })
          }
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end space-x-2">
        <LoadingButton
          type="submit"
          loading={loading}
          loadingText="Adding User..."
        >
          Add User
        </LoadingButton>
      </div>
    </form>
  );
}

function ChangePasswordForm({
  userId,
  onSuccess,
}: {
  userId: string;
  onSuccess: () => void;
}) {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useSnackbarHelpers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`/api/masters/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change-password', newPassword }),
      });

      if (response.ok) {
        showSuccess(
          'Password Changed',
          'User password has been updated successfully.',
        );
        onSuccess();
        setNewPassword('');
      } else {
        const data = await response.json();
        showError(
          'Update Failed',
          data.message || 'Failed to change password.',
        );
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showError(
        'Network Error',
        'Failed to change password. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="newPassword">
          New Password <span className="text-red-500">*</span>
        </Label>
        <PasswordInput
          id="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="mt-1"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <LoadingButton
          type="submit"
          loading={loading}
          loadingText="Changing Password..."
        >
          Change Password
        </LoadingButton>
      </div>
    </form>
  );
}

function StoneForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    color: '',
    size: '',
    unit: 'g' as 'g' | 'kg',
  });
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useSnackbarHelpers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/inventory/stones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, quantity: 0 }),
      });

      if (response.ok) {
        showSuccess(
          'Stone Type Added',
          'New stone type has been added successfully.',
        );
        onSuccess();
        setFormData({ name: '', number: '', color: '', size: '', unit: 'g' });
      } else {
        const data = await response.json();
        showError(
          'Creation Failed',
          data.message || 'Failed to add stone type.',
        );
      }
    } catch (error) {
      console.error('Error creating stone:', error);
      showError('Network Error', 'Failed to add stone type. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="mt-1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="number">
            Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="number"
            value={formData.number}
            onChange={(e) =>
              setFormData({ ...formData, number: e.target.value })
            }
            required
            className="mt-1"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="color">
            Color <span className="text-red-500">*</span>
          </Label>
          <Input
            id="color"
            value={formData.color}
            onChange={(e) =>
              setFormData({ ...formData, color: e.target.value })
            }
            required
            className="mt-1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="size">
            Size <span className="text-red-500">*</span>
          </Label>
          <Input
            id="size"
            value={formData.size}
            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
            required
            className="mt-1"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="unit">
          Unit <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.unit}
          onValueChange={(value: 'g' | 'kg') =>
            setFormData({ ...formData, unit: value })
          }
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="g">Grams (g)</SelectItem>
            <SelectItem value="kg">Kilograms (kg)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end space-x-2">
        <LoadingButton
          type="submit"
          loading={loading}
          loadingText="Adding Stone Type..."
        >
          Add Stone Type
        </LoadingButton>
      </div>
    </form>
  );
}

function PaperForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    width: '',
    piecesPerRoll: '',
    weightPerPiece: '',
    inventoryType: 'internal' as 'internal' | 'out',
  });
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useSnackbarHelpers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/inventory/paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          width: parseFloat(formData.width),
          quantity: 0,
          piecesPerRoll: parseInt(formData.piecesPerRoll),
          weightPerPiece: parseFloat(formData.weightPerPiece),
          inventoryType: formData.inventoryType,
        }),
      });

      if (response.ok) {
        showSuccess(
          'Paper Type Added',
          'New paper type has been added successfully.',
        );
        onSuccess();
        setFormData({
          name: '',
          width: '',
          piecesPerRoll: '',
          weightPerPiece: '',
          inventoryType: 'internal',
        });
      } else {
        const data = await response.json();
        showError(
          'Creation Failed',
          data.message || 'Failed to add paper type.',
        );
      }
    } catch (error) {
      console.error('Error creating paper:', error);
      showError('Network Error', 'Failed to add paper type. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., A4 Paper, Letter Paper"
          required
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="width">
            Width (inches) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="width"
            type="number"
            step="0.1"
            value={formData.width}
            onChange={(e) =>
              setFormData({ ...formData, width: e.target.value })
            }
            placeholder="e.g., 8.5"
            required
            className="mt-1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="piecesPerRoll">
            Pieces per Roll <span className="text-red-500">*</span>
          </Label>
          <Input
            id="piecesPerRoll"
            type="number"
            value={formData.piecesPerRoll}
            onChange={(e) =>
              setFormData({ ...formData, piecesPerRoll: e.target.value })
            }
            placeholder="e.g., 500"
            required
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="weightPerPiece">
            Weight per Piece (g) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="weightPerPiece"
            type="number"
            step="0.1"
            value={formData.weightPerPiece}
            onChange={(e) =>
              setFormData({ ...formData, weightPerPiece: e.target.value })
            }
            placeholder="e.g., 4.5"
            required
            className="mt-1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inventoryType">
            Inventory Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.inventoryType}
            onValueChange={(value: 'internal' | 'out') =>
              setFormData({ ...formData, inventoryType: value })
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="internal">Internal</SelectItem>
              <SelectItem value="out">Out</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <LoadingButton
          type="submit"
          loading={loading}
          loadingText="Adding Paper Type..."
        >
          Add Paper Type
        </LoadingButton>
      </div>
    </form>
  );
}

function PlasticForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    width: '',
  });
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useSnackbarHelpers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/inventory/plastic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          width: parseFloat(formData.width),
          quantity: 0,
        }),
      });

      if (response.ok) {
        showSuccess(
          'Plastic Type Added',
          'New plastic type has been added successfully.',
        );
        onSuccess();
        setFormData({ name: '', width: '' });
      } else {
        const data = await response.json();
        showError(
          'Creation Failed',
          data.message || 'Failed to add plastic type.',
        );
      }
    } catch (error) {
      console.error('Error creating plastic:', error);
      showError(
        'Network Error',
        'Failed to add plastic type. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Clear Plastic, Colored Plastic"
          required
          className="mt-1"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="width">
          Width (inches) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="width"
          type="number"
          step="0.1"
          value={formData.width}
          onChange={(e) => setFormData({ ...formData, width: e.target.value })}
          placeholder="e.g., 12.5"
          required
          className="mt-1"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <LoadingButton
          type="submit"
          loading={loading}
          loadingText="Adding Plastic Type..."
        >
          Add Plastic Type
        </LoadingButton>
      </div>
    </form>
  );
}

function TapeForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: 'Cello Tape',
  });
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useSnackbarHelpers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/inventory/tape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          quantity: 0,
        }),
      });

      if (response.ok) {
        showSuccess(
          'Tape Type Added',
          'Tape type has been added successfully.',
        );
        onSuccess();
        setFormData({ name: 'Cello Tape' });
      } else {
        const data = await response.json();
        showError(
          'Creation Failed',
          data.message || 'Failed to add tape type.',
        );
      }
    } catch (error) {
      console.error('Error creating tape:', error);
      showError('Network Error', 'Failed to add tape type. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Cello Tape, Scotch Tape"
          required
          className="mt-1"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <LoadingButton
          type="submit"
          loading={loading}
          loadingText="Adding Tape Type..."
        >
          Add Tape Type
        </LoadingButton>
      </div>
    </form>
  );
}

// Edit form components
function EditPaperForm({
  paper,
  onSuccess,
  onCancel,
}: {
  paper: Paper;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: paper.name,
    width: paper.width.toString(),
    piecesPerRoll: paper.piecesPerRoll.toString(),
    weightPerPiece: paper.weightPerPiece.toString(),
    inventoryType: paper.inventoryType,
  });
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useSnackbarHelpers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`/api/inventory/paper/${paper._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          width: parseFloat(formData.width),
          piecesPerRoll: parseInt(formData.piecesPerRoll),
          weightPerPiece: parseFloat(formData.weightPerPiece),
        }),
      });

      if (response.ok) {
        showSuccess(
          'Paper Type Updated',
          'Paper type has been updated successfully.',
        );
        onSuccess();
      } else {
        const data = await response.json();
        showError(
          'Update Failed',
          data.message || 'Failed to update paper type.',
        );
      }
    } catch (error) {
      console.error('Error updating paper:', error);
      showError(
        'Network Error',
        'Failed to update paper type. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="edit-name">
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="edit-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., A4 Paper, Letter Paper"
          required
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-width">
            Width (inches) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="edit-width"
            type="number"
            step="0.1"
            value={formData.width}
            onChange={(e) =>
              setFormData({ ...formData, width: e.target.value })
            }
            placeholder="e.g., 8.5"
            required
            className="mt-1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-piecesPerRoll">
            Pieces per Roll <span className="text-red-500">*</span>
          </Label>
          <Input
            id="edit-piecesPerRoll"
            type="number"
            value={formData.piecesPerRoll}
            onChange={(e) =>
              setFormData({ ...formData, piecesPerRoll: e.target.value })
            }
            placeholder="e.g., 500"
            required
            className="mt-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-weightPerPiece">
          Weight per Piece (g) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="edit-weightPerPiece"
          type="number"
          step="0.1"
          value={formData.weightPerPiece}
          onChange={(e) =>
            setFormData({ ...formData, weightPerPiece: e.target.value })
          }
          placeholder="e.g., 4.5"
          required
          className="mt-1"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <LoadingButton
          type="submit"
          loading={loading}
          loadingText="Updating..."
        >
          Update Paper Type
        </LoadingButton>
      </div>
    </form>
  );
}

function EditPlasticForm({
  plastic,
  onSuccess,
  onCancel,
}: {
  plastic: Plastic;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: plastic.name,
    width: plastic.width.toString(),
  });
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useSnackbarHelpers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`/api/inventory/plastic/${plastic._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          width: parseFloat(formData.width),
        }),
      });

      if (response.ok) {
        showSuccess(
          'Plastic Type Updated',
          'Plastic type has been updated successfully.',
        );
        onSuccess();
      } else {
        const data = await response.json();
        showError(
          'Update Failed',
          data.message || 'Failed to update plastic type.',
        );
      }
    } catch (error) {
      console.error('Error updating plastic:', error);
      showError(
        'Network Error',
        'Failed to update plastic type. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="edit-plastic-name">
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="edit-plastic-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Clear Plastic, Colored Plastic"
          required
          className="mt-1"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-plastic-width">
          Width (inches) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="edit-plastic-width"
          type="number"
          step="0.1"
          value={formData.width}
          onChange={(e) => setFormData({ ...formData, width: e.target.value })}
          placeholder="e.g., 12.5"
          required
          className="mt-1"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <LoadingButton
          type="submit"
          loading={loading}
          loadingText="Updating..."
        >
          Update Plastic Type
        </LoadingButton>
      </div>
    </form>
  );
}

function EditTapeForm({
  tape,
  onSuccess,
  onCancel,
}: {
  tape: Tape;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: tape.name,
  });
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useSnackbarHelpers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`/api/inventory/tape/${tape._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
        }),
      });

      if (response.ok) {
        showSuccess(
          'Tape Type Updated',
          'Tape type has been updated successfully.',
        );
        onSuccess();
      } else {
        const data = await response.json();
        showError(
          'Update Failed',
          data.message || 'Failed to update tape type.',
        );
      }
    } catch (error) {
      console.error('Error updating tape:', error);
      showError(
        'Network Error',
        'Failed to update tape type. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="edit-tape-name">
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="edit-tape-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Cello Tape, Scotch Tape"
          required
          className="mt-1"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <LoadingButton
          type="submit"
          loading={loading}
          loadingText="Updating..."
        >
          Update Tape Type
        </LoadingButton>
      </div>
    </form>
  );
}
