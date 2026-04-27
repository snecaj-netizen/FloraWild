import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-nature-50">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mb-6">
            <AlertTriangle size={40} />
          </div>
          <h2 className="text-2xl font-serif font-bold text-nature-900 mb-2">Ops! Qualcosa è andato storto</h2>
          <p className="text-nature-600 mb-8 max-w-xs">
            Si è verificato un errore inaspettato. Prova a ricaricare l'applicazione.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-nature-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-nature-700 transition-all"
          >
            <RefreshCw size={20} />
            Ricarica App
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-8 p-4 bg-white rounded-xl text-left text-xs overflow-auto max-w-full border border-red-100 text-red-500">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
