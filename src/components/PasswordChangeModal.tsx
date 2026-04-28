import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onConfirm: (password: string) => Promise<void>;
  onCancel: () => void;
}

export function PasswordChangeModal({ 
  isOpen, 
  onConfirm, 
  onCancel
}: PasswordChangeModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("La password deve essere di almeno 6 caratteri.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      await onConfirm(password);
      setPassword('');
      onCancel();
    } catch (err: any) {
      setError(err.message || "Errore durante l'aggiornamento della password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl space-y-6"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center">
                <Lock size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-serif text-nature-900">Cambia Password</h3>
                <p className="text-nature-500 text-sm leading-relaxed">Inserisci la tua nuova password qui sotto.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nuova password"
                  autoFocus
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 flex-1 outline-none px-4 pr-12 focus:ring-2 focus:ring-brand-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {error && (
                <p className="text-red-500 text-xs text-center font-medium bg-red-50 py-2 rounded-lg">{error}</p>
              )}

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-brand-500 text-white rounded-2xl font-bold shadow-lg shadow-brand-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Aggiorna Password"}
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="w-full bg-nature-100 text-nature-700 py-3 rounded-2xl font-medium text-sm"
                >
                  Annulla
                </button>
              </div>
            </form>

            {!isLoading && (
              <button 
                onClick={onCancel}
                className="absolute top-4 right-4 p-2 text-nature-300 hover:text-nature-500 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
