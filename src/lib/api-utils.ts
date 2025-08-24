import { useRouter } from 'next/navigation';

export async function authenticatedFetchWithRedirect(
  url: string,
  options: RequestInit = {},
  router?: ReturnType<typeof useRouter>,
): Promise<Response> {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for authentication
    ...options,
  };

  const response = await fetch(url, defaultOptions);
  
  // Handle 401 responses with router redirect
  if (response.status === 401) {
    if (router) {
      router.push('/unauthorized');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/unauthorized';
    }
  }
  
  return response;
}

export function useAuthenticatedFetch() {
  const router = useRouter();
  
  return (url: string, options: RequestInit = {}) => 
    authenticatedFetchWithRedirect(url, options, router);
}
