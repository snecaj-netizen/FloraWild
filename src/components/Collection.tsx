import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Trash2, ExternalLink, Leaf, Loader2 } from 'lucide-react';
import { Plant } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface CollectionProps {
  plants: Plant[];
  onSelect: (plant: Plant) => void;
  onDelete: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Collection({ plants, onSelect, onDelete, searchQuery, onSearchChange }: CollectionProps) {
  const [activeTab, setActiveTab] = useState<'plant' | 'mushroom'>('plant');

  const filteredPlants = plants.filter(p => {
    const categoryMatch = (p.category || 'plant') === activeTab;
    const searchMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       p.scientificName.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl font-serif mb-2">La tua Collezione</h1>
        <p className="text-nature-500">{activeTab === 'plant' ? 'Le piante' : 'I funghi'} che hai scoperto e salvato.</p>
      </header>

      <div className="flex p-1 bg-nature-100 rounded-2xl w-full">
        <button
          onClick={() => setActiveTab('plant')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
            activeTab === 'plant' ? "bg-white text-brand-600 shadow-sm" : "text-nature-500 hover:text-nature-700"
          )}
        >
          <Leaf size={16} />
          Piante
        </button>
        <button
          onClick={() => setActiveTab('mushroom')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
            activeTab === 'mushroom' ? "bg-white text-brand-600 shadow-sm" : "text-nature-500 hover:text-nature-700"
          )}
        >
          <Loader2 size={16} />
          Funghi
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-nature-300" size={20} />
        <input
          type="text"
          placeholder="Cerca nella tua collezione..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredPlants && filteredPlants.length > 0 ? (
          filteredPlants.map((plant) => (
            <motion.div
              layout
              key={plant.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-3xl overflow-hidden flex h-32 group"
            >
              <div 
                className="w-32 shrink-0 cursor-pointer overflow-hidden group/img"
                onClick={() => onSelect(plant)}
              >
                <img src={plant.imageUrl} alt={plant.name} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-lg leading-tight">{plant.name}</h3>
                  <p className="text-xs italic text-nature-400">{plant.scientificName}</p>
                </div>
                <div className="flex justify-between items-center">
                  <span className={plant.isEdible ? "text-green-600 text-[10px] font-bold uppercase" : "text-red-600 text-[10px] font-bold uppercase"}>
                    {plant.isEdible ? 'Commestibile' : 'Non Commestibile'}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onDelete(plant.id)}
                      className="p-2 text-nature-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button 
                      onClick={() => onSelect(plant)}
                      className="p-2 text-brand-500 hover:text-brand-600 transition-colors"
                    >
                      <ExternalLink size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-nature-300 italic">Nessun {activeTab === 'plant' ? 'risultato botanico' : 'risultato micologico'} trovato.</p>
          </div>
        )}
      </div>
    </div>
  );
}
