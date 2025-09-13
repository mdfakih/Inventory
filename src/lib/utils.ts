import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  // Don't set Content-Type for FormData (file uploads)
  // Let the browser set it automatically with the proper boundary
  const isFormData = options.body instanceof FormData;

  const defaultOptions: RequestInit = {
    headers: isFormData
      ? { ...options.headers } // Don't set Content-Type for FormData
      : {
          'Content-Type': 'application/json',
          ...options.headers,
        },
    credentials: 'include', // Include cookies for authentication
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    // Handle 401 errors by dispatching custom event for auth context to handle
    if (response.status === 401) {
      const event = new CustomEvent('api-error', {
        detail: { status: 401, url },
      });
      window.dispatchEvent(event);
    }

    return response;
  } catch (error) {
    console.error('Authenticated fetch failed:', error);
    throw error;
  }
}

export async function safeJsonParse<T = unknown>(
  response: Response,
): Promise<T> {
  const contentType = response.headers.get('content-type');

  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(
      `Expected JSON response but got ${
        contentType || 'unknown content type'
      }. Response: ${text.substring(0, 200)}...`,
    );
  }

  return response.json();
}

export function generateJobOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');

  return `JO-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
}

export function generateReceiptNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');

  return `RC-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
}
