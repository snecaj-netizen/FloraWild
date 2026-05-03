import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  variant?: 'danger' | 'primary';
}

export function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Conferma",
  variant = 'danger'
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl space-y-6"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center",
                variant === 'danger' ? "bg-red-50 text-red-500" : "bg-brand-50 text-brand-500"
              )}>
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-serif text-nature-900">{title}</h3>
                <p className="text-nature-500 text-sm leading-relaxed">{message}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={onConfirm}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all text-white",
                  variant === 'danger' ? "bg-red-500 shadow-red-100" : "bg-brand-500 shadow-brand-100"
                )}
              >
                {confirmText}
              </button>
              <button
                onClick={onCancel}
                className="w-full bg-nature-100 text-nature-700 py-3 rounded-2xl font-medium text-sm"
              >
                Annulla
              </button>
            </div>

            <button 
              onClick={onCancel}
              className="absolute top-4 right-4 p-2 text-nature-300 hover:text-nature-500 transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
