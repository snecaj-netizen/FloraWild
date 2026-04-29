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
      <footer className="px-4 py-8 mt-auto text-center border-t border-nature-100/50">
        <p className="text-[10px] text-nature-400 font-medium tracking-widest uppercase">
          &copy; {new Date().getFullYear()} Stefano Necaj
        </p>
      </footer>
    </div>
  );
}
