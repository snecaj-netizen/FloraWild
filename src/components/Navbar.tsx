import React from 'react';
import { Home, Camera, Library, Search } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { View } from '@/src/types';

interface NavbarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export function Navbar({ currentView, onViewChange }: NavbarProps) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'camera', icon: Camera, label: 'Identifica' },
    { id: 'collection', icon: Library, label: 'Collezione' },
    { id: 'search', icon: Search, label: 'Cerca' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-brand-200 px-6 py-3 pb-6 z-50">
      <div className="max-w-md mx-auto flex justify-between items-center">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as View)}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              currentView === item.id ? "text-nature-600" : "text-nature-300 hover:text-nature-400"
            )}
          >
            <item.icon size={24} strokeWidth={currentView === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
