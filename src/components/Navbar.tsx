import React from 'react';
import { Home, Camera, Library, Search } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { View } from '@/src/types';

import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  visible?: boolean;
}

export function Navbar({ currentView, onViewChange, visible = true }: NavbarProps) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'camera', icon: Camera, label: 'Identifica' },
    { id: 'collection', icon: Library, label: 'Collezione' },
    { id: 'search', icon: Search, label: 'Cerca' },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-brand-200 px-6 py-3 pb-6 z-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]"
        >
          <div className="max-w-md mx-auto flex justify-between items-center">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id as View)}
                className={cn(
                  "flex flex-col items-center gap-1 transition-colors relative",
                  currentView === item.id ? "text-nature-600" : "text-nature-300 hover:text-nature-400"
                )}
              >
                {currentView === item.id && (
                  <motion.div 
                    layoutId="nav-pill"
                    className="absolute -top-1 w-8 h-1 bg-nature-600 rounded-full"
                  />
                )}
                <item.icon size={24} strokeWidth={currentView === item.id ? 2.5 : 2} />
                <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
              </button>
            ))}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
