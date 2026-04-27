import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

interface SlideshowProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function Slideshow({ images, initialIndex = 0, isOpen, onClose, title }: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!isOpen || images.length === 0) return null;

  const next = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 sm:p-10"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center text-white z-10">
              <div>
                {title && <h3 className="font-serif text-xl">{title}</h3>}
                <p className="text-xs opacity-60">Foto {currentIndex + 1} di {images.length}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={32} />
              </button>
            </div>

            {/* Main Image */}
            <div className="relative w-full h-[70vh] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentIndex}
                  src={images[currentIndex]}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>

              {/* Navigation Controls */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-4 p-4 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all backdrop-blur-md"
                  >
                    <ChevronLeft size={32} />
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-4 p-4 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all backdrop-blur-md"
                  >
                    <ChevronRight size={32} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto py-4 max-w-full no-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      currentIndex === idx ? 'border-brand-500 scale-110' : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
