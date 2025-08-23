'use client';

import { useEffect } from 'react';
import { authenticatedFetch } from '@/lib/utils';

export default function TestUnauthorizedPage() {
  useEffect(() => {
    // Test the 401 handling by making a request to /api/auth/me
    // This should redirect to /unauthorized if the user is not authenticated
    const testAuth = async () => {
      try {
        const response = await authenticatedFetch('/api/auth/me');
        console.log('Auth response:', response.status);
      } catch (error) {
        console.error('Auth error:', error);
      }
    };

    testAuth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Testing 401 Handling</h1>
        <p className="text-gray-600">
          This page tests the 401 unauthorized handling. 
          If you're not authenticated, you should be redirected to the unauthorized page.
        </p>
      </div>
    </div>
  );
}
