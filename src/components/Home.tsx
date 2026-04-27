import React from 'react';
import { Camera, Search, Leaf, Sprout, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { SavedSearch } from '../types';

interface HomeProps {
  onStartIdentify: () => void;
  onGoToCollection: () => void;
  onGoToSearch: (initialQuery?: string) => void;
  savedSearches?: SavedSearch[];
}

export function Home({ onStartIdentify, onGoToCollection, onGoToSearch, savedSearches = [] }: HomeProps) {
  const recentSearches = savedSearches.slice(0, 3);

  return (
    <div className="space-y-10 pb-10">
      <header className="text-center space-y-4">
        <div
          className="w-20 h-20 bg-nature-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-nature-200"
        >
          <Leaf className="text-white" size={40} />
        </div>
        <div className="space-y-1">
          <h1 className="text-5xl font-serif font-bold text-nature-900">FloraWild</h1>
          <p className="text-nature-500 italic">Piante selvatiche e funghi: scopri la natura</p>
        </div>
      </header>

      <section className="space-y-4">
        <button
          onClick={onStartIdentify}
          className="w-full p-8 bg-brand-500 rounded-[2rem] text-white flex flex-col items-center gap-4 shadow-xl shadow-brand-100 hover:bg-brand-600 transition-all active:scale-[0.98]"
        >
          <Camera size={48} />
          <div className="text-center">
            <h2 className="text-2xl font-serif">Identifica Ora</h2>
            <p className="text-brand-100 text-sm">Scatta una foto per iniziare</p>
          </div>
        </button>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onGoToCollection}
            className="p-6 bg-white rounded-[2rem] border border-brand-100 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-all group"
          >
            <Sprout className="text-nature-500 group-hover:scale-110 transition-transform" size={32} />
            <span className="font-serif text-lg text-nature-900">Collezione</span>
          </button>
          <button
            onClick={() => onGoToSearch()}
            className="p-6 bg-white rounded-[2rem] border border-brand-100 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-all group"
          >
            <Search className="text-brand-400 group-hover:scale-110 transition-transform" size={32} />
            <span className="font-serif text-lg text-nature-900">Esplora</span>
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-bold text-nature-400 uppercase tracking-widest flex items-center gap-2">
            <Clock size={16} />
            Ricerche Recenti
          </h3>
          {recentSearches.length > 0 && (
            <button 
              onClick={() => onGoToSearch()}
              className="text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              Vedi tutte
            </button>
          )}
        </div>
        
        {recentSearches.length > 0 ? (
          <div className="space-y-3">
            {recentSearches.map((saved) => (
              <button
                key={saved.id}
                onClick={() => onGoToSearch(saved.query)}
                className="w-full p-3 bg-white rounded-2xl border border-nature-100 shadow-sm flex items-center justify-between group hover:bg-nature-50 transition-all"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-nature-100 bg-nature-50">
                    {saved.imageUrl ? (
                      <img 
                        src={saved.imageUrl} 
                        alt={saved.query} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-nature-300">
                        <Search size={20} />
                      </div>
                    )}
                  </div>
                  <span className="text-nature-800 font-medium truncate pr-2">{saved.query}</span>
                </div>
                <ChevronRight className="text-nature-300 group-hover:text-nature-500 transition-colors shrink-0" size={18} />
              </button>
            ))}
          </div>
        ) : (
          <div className="p-6 border-2 border-dashed border-nature-100 rounded-[2rem] text-center">
            <p className="text-sm text-nature-400 italic">Le tue ricerche salvate appariranno qui.</p>
          </div>
        )}
      </section>

      <section className="glass-card p-8 rounded-[2rem] space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-nature-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
        <h3 className="text-xl font-serif flex items-center gap-2 relative">
          <BookOpen size={24} className="text-nature-400" />
          Lo sapevi?
        </h3>
        <p className="text-nature-600 text-sm leading-relaxed italic relative">
          "Molte piante selvatiche e funghi che incontriamo in natura hanno proprietà straordinarie o sapori unici. FloraWild ti aiuta a riscoprirli in sicurezza, distinguendo le specie preziose da quelle pericolose."
        </p>
      </section>
    </div>
  );
}
