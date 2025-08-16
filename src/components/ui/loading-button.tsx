import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    { loading = false, loadingText, children, className, disabled, ...props },
    ref,
  ) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        className={cn(className)}
        {...props}
      >
        {loading && (
          <Spinner
            size="sm"
            className="mr-2"
          />
        )}
        {loading && loadingText ? loadingText : children}
      </Button>
    );
  },
);

LoadingButton.displayName = 'LoadingButton';
