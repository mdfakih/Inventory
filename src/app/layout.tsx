import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/navigation';
import { ThemeProvider } from '@/components/theme-provider';
import { SnackbarProvider } from '@/components/ui/snackbar';

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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SnackbarProvider>
            <Navigation />
            <main className="container mx-auto px-4 py-4 sm:py-8">
              {children}
            </main>
          </SnackbarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
