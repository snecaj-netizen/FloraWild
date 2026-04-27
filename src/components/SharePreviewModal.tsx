import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Download } from 'lucide-react';

interface SharePreviewModalProps {
  isOpen: boolean;
  image: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  isSharing: boolean;
}

export function SharePreviewModal({ isOpen, image, onConfirm, onCancel, isSharing }: SharePreviewModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-[2.5rem] overflow-hidden w-full max-w-sm shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-nature-100 flex justify-between items-center">
              <h3 className="text-xl font-serif font-bold text-nature-900">Anteprima Scheda</h3>
              <button onClick={onCancel} className="p-2 text-nature-400 hover:text-nature-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 bg-nature-50 flex-1 overflow-y-auto max-h-[60vh] flex justify-center">
              {image ? (
                <img 
                  src={image} 
                  alt="Anteprima condivisione" 
                  className="w-full h-auto rounded-2xl shadow-lg border border-white"
                />
              ) : (
                <div className="aspect-[3/4] w-full bg-nature-100 animate-pulse rounded-2xl" />
              )}
            </div>

            <div className="p-6 space-y-3">
              <button
                onClick={onConfirm}
                disabled={isSharing || !image}
                className="w-full bg-brand-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-brand-100 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send size={20} />
                {isSharing ? 'Invio in corso...' : 'Condividi ora'}
              </button>
              <button
                onClick={onCancel}
                className="w-full bg-nature-100 text-nature-700 py-3 rounded-2xl font-medium text-sm"
              >
                Annulla
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
