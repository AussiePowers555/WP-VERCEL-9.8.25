import type {Metadata} from 'next';
import './globals.css';
import '../styles/glassmorphism.css';
import { ClientLayout } from "@/components/client-layout";

export const metadata: Metadata = {
  title: 'PBikeRescue',
  description: 'Professional motorbike rental management system with AI-powered collections.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500&display=swap" rel="stylesheet" />

      </head>
      <body className="font-body antialiased min-h-screen bg-gradient-dark relative overflow-x-hidden">
        {/* Ambient floating elements */}
        <div className="fixed inset-0 -z-10 ambient-orbs pointer-events-none"></div>
        
        {/* Background gradient mesh */}
        <div className="fixed inset-0 -z-20">
          <div className="absolute inset-0 bg-gradient-mesh opacity-40"></div>
        </div>
        
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}