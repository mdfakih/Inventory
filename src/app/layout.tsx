import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/navigation';
import { ThemeProvider } from '@/components/theme-provider';
import { SnackbarProvider } from '@/components/ui/snackbar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/lib/auth-context';
import ErrorBoundary from '@/components/error-boundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Inventory Management System',
  description: 'Full-stack inventory and order management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body className={`${inter.className} min-h-screen bg-background`}>
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SnackbarProvider>
              <TooltipProvider>
                <AuthProvider>
                  <Navigation />
                  <main className="min-h-[calc(100vh-4rem)]">{children}</main>
                </AuthProvider>
              </TooltipProvider>
            </SnackbarProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
