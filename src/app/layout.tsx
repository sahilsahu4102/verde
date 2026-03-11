import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/context/AuthContext"
import { SubscriptionProvider } from "@/context/SubscriptionContext"

export const metadata: Metadata = {
  title: 'VERDE: Plant-Based Transition Platform',
  description: 'A platform to help cafes transition to plant-based menus.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>
          <SubscriptionProvider>
            {children}
          </SubscriptionProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
