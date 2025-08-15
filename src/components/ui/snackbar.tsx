'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type SnackbarType = 'success' | 'error' | 'warning' | 'info';

interface SnackbarMessage {
  id: string;
  type: SnackbarType;
  title: string;
  message?: string;
  duration?: number;
}

interface SnackbarContextType {
  showSnackbar: (message: Omit<SnackbarMessage, 'id'>) => void;
  hideSnackbar: (id: string) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
}

interface SnackbarProviderProps {
  children: ReactNode;
}

export function SnackbarProvider({ children }: SnackbarProviderProps) {
  const [snackbars, setSnackbars] = useState<SnackbarMessage[]>([]);

  const showSnackbar = (message: Omit<SnackbarMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newSnackbar = { ...message, id };
    
    setSnackbars(prev => [...prev, newSnackbar]);

    // Auto-hide after duration (default 5 seconds)
    const duration = message.duration || 5000;
    setTimeout(() => {
      hideSnackbar(id);
    }, duration);
  };

  const hideSnackbar = (id: string) => {
    setSnackbars(prev => prev.filter(snackbar => snackbar.id !== id));
  };

  const getIcon = (type: SnackbarType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <XCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5" />;
      case 'info':
        return <Info className="h-5 w-5" />;
    }
  };

  const getStyles = (type: SnackbarType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/20 dark:border-green-800 dark:text-green-400';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-800 dark:text-red-400';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950/20 dark:border-yellow-800 dark:text-yellow-400';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-400';
    }
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar, hideSnackbar }}>
      {children}
      
      {/* Snackbar Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {snackbars.map((snackbar) => (
          <div
            key={snackbar.id}
            className={cn(
              'flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all duration-300 ease-in-out',
              getStyles(snackbar.type)
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(snackbar.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm">
                {snackbar.title}
              </h4>
              {snackbar.message && (
                <p className="text-sm mt-1 opacity-90">
                  {snackbar.message}
                </p>
              )}
            </div>
            
            <button
              onClick={() => hideSnackbar(snackbar.id)}
              className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </SnackbarContext.Provider>
  );
}

// Convenience functions for different snackbar types
export function useSnackbarHelpers() {
  const { showSnackbar } = useSnackbar();

  return {
    showSuccess: (title: string, message?: string, duration?: number) => {
      showSnackbar({ type: 'success', title, message, duration });
    },
    showError: (title: string, message?: string, duration?: number) => {
      showSnackbar({ type: 'error', title, message, duration });
    },
    showWarning: (title: string, message?: string, duration?: number) => {
      showSnackbar({ type: 'warning', title, message, duration });
    },
    showInfo: (title: string, message?: string, duration?: number) => {
      showSnackbar({ type: 'info', title, message, duration });
    },
  };
}
