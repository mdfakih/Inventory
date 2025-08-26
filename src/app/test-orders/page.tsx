'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function TestOrdersPage() {
  const [count, setCount] = useState(0);
  const { loading: authLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    console.log('TestOrdersPage useEffect triggered', { authLoading, isAuthenticated });
    setCount(prev => prev + 1);
  }, [authLoading, isAuthenticated]);

  if (authLoading) {
    return <div>Loading authentication...</div>;
  }

  if (!isAuthenticated) {
    return <div>Not authenticated</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Orders Page</h1>
      <p>This page has been rendered {count} times</p>
      <p>Auth Loading: {authLoading ? 'Yes' : 'No'}</p>
      <p>Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
    </div>
  );
}
