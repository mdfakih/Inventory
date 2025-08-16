'use client';

import { useState } from 'react';
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
import { LoadingButton } from '@/components/ui/loading-button';
import { useSnackbarHelpers } from '@/components/ui/snackbar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  status: 'active' | 'blocked';
  createdAt: string;
}

interface EditUserFormProps {
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditUserForm({
  user,
  onSuccess,
  onCancel,
}: EditUserFormProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
  });
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useSnackbarHelpers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`/api/masters/users/${user._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-user',
          ...formData,
        }),
      });

      if (response.ok) {
        showSuccess('User Updated', 'User has been updated successfully.');
        onSuccess();
      } else {
        const data = await response.json();
        showError('Update Failed', data.message || 'Failed to update user.');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showError('Network Error', 'Failed to update user. Please try again.');
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
        <Label htmlFor="editName">
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="editName"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="mt-1"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="editEmail">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="editEmail"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="mt-1"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="editRole">
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
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <LoadingButton
          type="submit"
          loading={loading}
          loadingText="Updating User..."
        >
          Update User
        </LoadingButton>
      </div>
    </form>
  );
}
