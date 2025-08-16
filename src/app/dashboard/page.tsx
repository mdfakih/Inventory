'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import ManagerDashboard from '@/components/dashboard/manager-dashboard';
import EmployeeDashboard from '@/components/dashboard/employee-dashboard';

export default function DashboardPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {user.role === 'admin' && <AdminDashboard />}
      {user.role === 'manager' && <ManagerDashboard />}
      {user.role === 'employee' && <EmployeeDashboard />}
    </div>
  );
}
