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
import { Spinner, SpinnerPage } from '@/components/ui/spinner';
import { LoadingButton } from '@/components/ui/loading-button';
import { EmptyState } from '@/components/ui/empty-state';
import { useSnackbarHelpers } from '@/components/ui/snackbar';
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
} from 'lucide-react';

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
  width: number;
  quantity: number;
  piecesPerRoll: number;
}

interface Plastic {
  _id: string;
  width: number;
  quantity: number;
}

interface Tape {
  _id: string;
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
  const router = useRouter();
  const { showSuccess, showError, showWarning } = useSnackbarHelpers();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const loadAllData = useCallback(async () => {
    try {
      // Load all master data
      const [
        usersRes,
        passwordResetRes,
        stonesRes,
        papersRes,
        plasticsRes,
        tapesRes,
      ] = await Promise.all([
        fetch('/api/masters/users'),
        fetch('/api/auth/password-reset-requests'),
        fetch('/api/inventory/stones'),
        fetch('/api/inventory/paper'),
        fetch('/api/inventory/plastic'),
        fetch('/api/inventory/tape'),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.data || []);
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
    }
  }, [showError]);

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
  }, [authLoading, isAuthenticated, user, router, showError, loadAllData]);

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
        await loadAllData();
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
        await loadAllData();
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Master Management</h1>
        <p className="text-muted-foreground">
          Manage all master data and system configurations
        </p>
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
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
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
                    Manage paper types and specifications
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Paper Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Paper Type</DialogTitle>
                    </DialogHeader>
                    <PaperForm onSuccess={loadAllData} />
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
                        <TableHead>Width (inches)</TableHead>
                        <TableHead>Pieces per Roll</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {papers.map((paper) => (
                        <TableRow key={paper._id}>
                          <TableCell className="font-medium">
                            {paper.width}&quot;
                          </TableCell>
                          <TableCell>{paper.piecesPerRoll}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
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
                    Manage plastic types and specifications
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Plastic Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Plastic Type</DialogTitle>
                    </DialogHeader>
                    <PlasticForm onSuccess={loadAllData} />
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
                        <TableHead>Width (inches)</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plastics.map((plastic) => (
                        <TableRow key={plastic._id}>
                          <TableCell className="font-medium">
                            {plastic.width}&quot;
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
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
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Tape Type</DialogTitle>
                    </DialogHeader>
                    <TapeForm onSuccess={loadAllData} />
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
                        <TableHead>Type</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tapes.map((tape) => (
                        <TableRow key={tape._id}>
                          <TableCell className="font-medium">
                            Cello Tape
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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
        <Label htmlFor="role">
          Role <span className="text-red-500">*</span>
        </Label>
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
    width: '',
    piecesPerRoll: '',
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
          width: parseInt(formData.width),
          quantity: 0,
          piecesPerRoll: parseInt(formData.piecesPerRoll),
        }),
      });

      if (response.ok) {
        showSuccess(
          'Paper Type Added',
          'New paper type has been added successfully.',
        );
        onSuccess();
        setFormData({ width: '', piecesPerRoll: '' });
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="width">
            Width (inches) <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.width}
            onValueChange={(value) =>
              setFormData({ ...formData, width: value })
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select width" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="9">9 inches</SelectItem>
              <SelectItem value="13">13 inches</SelectItem>
              <SelectItem value="16">16 inches</SelectItem>
              <SelectItem value="19">19 inches</SelectItem>
              <SelectItem value="20">20 inches</SelectItem>
              <SelectItem value="24">24 inches</SelectItem>
            </SelectContent>
          </Select>
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
            required
            className="mt-1"
          />
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
          width: parseInt(formData.width),
          quantity: 0,
        }),
      });

      if (response.ok) {
        showSuccess(
          'Plastic Type Added',
          'New plastic type has been added successfully.',
        );
        onSuccess();
        setFormData({ width: '' });
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
        <Label htmlFor="width">
          Width (inches) <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.width}
          onValueChange={(value) => setFormData({ ...formData, width: value })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select width" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12">12 inches</SelectItem>
            <SelectItem value="14">14 inches</SelectItem>
            <SelectItem value="16">16 inches</SelectItem>
            <SelectItem value="18">18 inches</SelectItem>
            <SelectItem value="20">20 inches</SelectItem>
          </SelectContent>
        </Select>
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
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useSnackbarHelpers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/inventory/tape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: 0 }),
      });

      if (response.ok) {
        showSuccess(
          'Tape Type Added',
          'Cello tape type has been added successfully.',
        );
        onSuccess();
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
      <div className="text-center py-4">
        <p className="text-muted-foreground">
          Cello Tape type will be added to the system.
        </p>
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
