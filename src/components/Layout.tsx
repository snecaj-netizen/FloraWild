import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-nature-50 pb-24">
      <main className="p-4">
        {children}
      </main>
    </div>
  );
}
