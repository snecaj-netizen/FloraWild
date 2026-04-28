import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search as SearchIcon, Utensils, Heart, Loader2, Sparkles, Save, Trash2, Clock, Check, ChevronRight, Download, Copy, FileText, WifiOff, Maximize2, X } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { User } from 'firebase/auth';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { OperationType, SavedSearch } from '../types';
import { cn } from '../lib/utils';
import { Slideshow } from './Slideshow';

interface SearchProps {
  user: User | null;
  onFirestoreError: (error: any, operationType: OperationType, path: string | null) => void;
  initialQuery?: string;
  onBack?: () => void;
  savedSearches: SavedSearch[];
}

const OFFLINE_CACHE_KEY = 'flora_search_cache';

export function Search({ user, onFirestoreError, initialQuery, onBack, savedSearches }: SearchProps) {
  const [activeCategory, setActiveCategory] = useState<'plant' | 'mushroom'>('plant');
  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const [result, setResult] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSavedSearch, setActiveSavedSearch] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const performSearch = async (queryText: string) => {
    if (!queryText.trim()) return;

    setIsLoading(true);
    setResult(null);
    setImageUrl(undefined);
    setImageUrls([]);
    setSaveSuccess(false);
    setActiveSavedSearch(null);

    try {
      let apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) apiKey = apiKey.trim();
      
      if (!apiKey || apiKey === 'undefined' || apiKey === 'null' || apiKey.length < 20) {
        setResult("Errore: Chiave API Gemini non trovata o non valida.");
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const expertRole = activeCategory === 'plant' 
        ? "un esperto di botanica, cucina selvatica e fitoterapia" 
        : "un micologo esperto, conoscitore di funghi commestibili e velenosi";

      const prompt = `Sei ${expertRole}. 
       Rispondi alla seguente domanda o ricerca: "${queryText}".
      Fornisci informazioni su ${activeCategory === 'plant' ? 'piante selvatiche, ricette o usi medicinali' : 'funghi, commestibilità, pericoli e habitat'}.
      Usa un tono professionale ma appassionato. Formatta la risposta in Markdown.
      Inoltre, alla fine della tua risposta, aggiungi DUE righe con questo formato ESATTO: 
      LATIN_NAME: [nome scientifico in latino della specie principale se applicabile, altrimenti scrivi N/A]
      IMAGE_KEYWORD: [una singola parola chiave in inglese per la ricerca immagini se LATIN_NAME è N/A]`;

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      
      let text = response.text;
      let keyword = 'nature';
      let latinName = '';
      
      const latinMatch = text.match(/LATIN_NAME:\s*([^\n\r]+)/);
      if (latinMatch) {
        latinName = latinMatch[1].trim();
        text = text.replace(/LATIN_NAME:\s*[^\n\r]+/, '').trim();
      }

      const keywordMatch = text.match(/IMAGE_KEYWORD:\s*(\w+)/);
      if (keywordMatch) {
        keyword = keywordMatch[1].toLowerCase();
        text = text.replace(/IMAGE_KEYWORD:\s*\w+/, '').trim();
      }

      setResult(text.trim() || "Nessun risultato trovato.");
      
      let newImageUrl = `https://loremflickr.com/800/600/wild,nature,${keyword}/all`;
      let newImageUrls: string[] = [];

      if (latinName && latinName !== 'N/A') {
        try {
          const gbifRes = await fetch(`https://api.gbif.org/v1/occurrence/search?scientificName=${encodeURIComponent(latinName)}&mediaType=StillImage&limit=5`);
          const gbifData = await gbifRes.json();
          
          if (gbifData.results && gbifData.results.length > 0) {
            const allImages: string[] = [];
            gbifData.results.forEach((res: any) => {
              if (res.media) {
                res.media.forEach((m: any) => {
                  if (m.identifier && m.type === 'StillImage') {
                    allImages.push(m.identifier);
                  }
                });
              }
            });
            
            if (allImages.length > 0) {
              newImageUrls = [...new Set(allImages)].slice(0, 8);
              newImageUrl = newImageUrls[0];
            }
          }
        } catch (err) {
          console.error("GBIF fetch error:", err);
        }
      }
      
      setImageUrl(newImageUrl);
      setImageUrls(newImageUrls.length > 0 ? newImageUrls : [newImageUrl]);
    } catch (error: any) {
      console.error("Search error:", error);
      setResult(`Si è verificato un errore durante la ricerca: ${error.message || "Riprova più tardi."}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery && savedSearches.length > 0) {
      const saved = savedSearches.find(s => s.query.toLowerCase() === initialQuery.toLowerCase());
      if (saved) {
        loadSavedSearch(saved);
      } else {
        setSearchQuery(initialQuery);
        performSearch(initialQuery);
      }
    } else if (initialQuery) {
      setSearchQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery, savedSearches.length > 0]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const handleSaveSearch = async () => {
    if (!user || !result || !searchQuery.trim()) return;

    setIsSaving(true);
    const path = 'saved_searches';
    try {
      await addDoc(collection(db, path), {
        query: searchQuery,
        category: activeCategory,
        result: result,
        imageUrl: imageUrl,
        imageUrls: imageUrls,
        userId: user.uid,
        createdAt: Date.now()
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      onFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSavedSearch = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const path = `saved_searches/${id}`;
    try {
      await deleteDoc(doc(db, 'saved_searches', id));
      if (activeSavedSearch === id) {
        setResult(null);
        setImageUrl(undefined);
        setImageUrls([]);
        setSearchQuery('');
        setActiveSavedSearch(null);
      }
    } catch (error) {
      onFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const loadSavedSearch = (saved: SavedSearch) => {
    setActiveCategory(saved.category || 'plant');
    setSearchQuery(saved.query);
    setResult(saved.result);
    setImageUrl(saved.imageUrl);
    setImageUrls(saved.imageUrls || (saved.imageUrl ? [saved.imageUrl] : []));
    setActiveSavedSearch(saved.id);
    setSaveSuccess(false);
  };

  const handleDownload = (saved: SavedSearch, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const element = document.createElement("a");
      const file = new Blob([saved.result], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `FloraWild_${saved.query.replace(/\s+/g, '_').substring(0, 20)}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  return (
    <div className="space-y-8 pb-10 relative">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif mb-2">Esplora</h1>
          <p className="text-nature-500">Cerca piante, funghi, ricette o rimedi naturali.</p>
        </div>
        {onBack && (
          <button 
            onClick={onBack}
            className="p-4 bg-white rounded-2xl border border-nature-100 shadow-sm text-nature-600 hover:text-nature-900 transition-all active:scale-95 shrink-0"
          >
            <X size={24} />
          </button>
        )}
      </header>

      <div className="flex p-1 bg-nature-100 rounded-2xl w-full max-w-sm">
        <button
          onClick={() => setActiveCategory('plant')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
            activeCategory === 'plant' ? "bg-white text-brand-600 shadow-sm" : "text-nature-500 hover:text-nature-700"
          )}
        >
          <Sparkles size={16} />
          Piante
        </button>
        <button
          onClick={() => setActiveCategory('mushroom')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
            activeCategory === 'mushroom' ? "bg-white text-brand-600 shadow-sm" : "text-nature-500 hover:text-nature-700"
          )}
        >
          <Loader2 size={16} />
          Funghi
        </button>
      </div>

      <form onSubmit={handleSearch} className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-400 group-focus-within:text-brand-600 transition-colors">
          <SearchIcon size={24} />
        </div>
        <input
          type="text"
          placeholder={activeCategory === 'plant' ? "Es. 'Ricette con ortica'..." : "Es. 'Come riconoscere un porcino'..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-12 py-4 bg-white rounded-2xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all shadow-sm"
        />
        <button 
          type="submit"
          disabled={isLoading || !searchQuery.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-500 text-white p-2 rounded-xl disabled:opacity-50 hover:bg-brand-600 transition-colors"
        >
          {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
        </button>
      </form>

      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-4 text-nature-400"
            >
              <Loader2 className="animate-spin" size={48} />
              <p className="italic font-serif">Interrogando la natura...</p>
            </motion.div>
          ) : result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
                <h3 className="text-xs font-bold text-nature-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} />
                  Risultato della ricerca
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-nature-50 text-nature-600 hover:bg-nature-100 transition-all"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copiato' : 'Copia'}
                  </button>
                  
                  {!activeSavedSearch && (
                    <button
                      onClick={handleSaveSearch}
                      disabled={isSaving || saveSuccess}
                      className={cn(
                        "flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full transition-all",
                        saveSuccess 
                          ? "bg-green-100 text-green-700" 
                          : "bg-brand-100 text-brand-700 hover:bg-brand-200"
                      )}
                    >
                      {isSaving ? <Loader2 className="animate-spin" size={14} /> : saveSuccess ? <Check size={14} /> : <Save size={14} />}
                      {saveSuccess ? 'Salvato!' : 'Salva per rileggere offline'}
                    </button>
                  )}
                </div>
              </div>
              <div className="glass-card rounded-[2rem] shadow-xl border border-brand-100 overflow-hidden relative">
                {imageUrl && (
                  <div 
                    className="w-full h-48 sm:h-64 overflow-hidden relative cursor-zoom-in group/img"
                    onClick={() => setShowSlideshow(true)}
                  >
                    <img 
                      src={imageUrl} 
                      alt={searchQuery} 
                      className="w-full h-full object-cover transition-transform group-hover/img:scale-105 duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover/img:opacity-100 transition-opacity">
                      <Maximize2 size={20} />
                    </div>
                    <div className="absolute bottom-4 left-6 text-white w-full pr-12">
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">
                        {imageUrl.includes('gbif.org') ? 'Galleria Botanica (GBIF)' : 'Visualizzazione Suggerita'}
                      </p>
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif text-xl truncate">{searchQuery}</h4>
                        {imageUrls.length > 1 && (
                          <span className="text-[10px] bg-brand-500/80 px-2 py-0.5 rounded-full font-bold">+{imageUrls.length - 1} foto</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-8 prose prose-nature max-w-none relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
                  <div className="relative">
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => { setResult(null); setSearchQuery(''); setActiveSavedSearch(null); }}
                className="text-sm text-nature-400 hover:text-nature-600 font-medium px-2"
              >
                Nuova ricerca
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 gap-4">
                <div className="p-6 bg-brand-50 border border-brand-100 rounded-3xl flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                    <Utensils className="text-brand-500" size={24} />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-brand-900">Ricette Selvagge</h4>
                    <p className="text-sm text-brand-700">Chiedi come cucinare erbe specifiche o suggerimenti per piatti stagionali.</p>
                  </div>
                </div>
                <div className="p-6 bg-nature-50 border border-nature-100 rounded-3xl flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                    <Heart className="text-nature-500" size={24} />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-nature-900">Rimedi Naturali</h4>
                    <p className="text-sm text-nature-700">Scopri tisane, decotti e proprietà curative delle piante spontanee.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-nature-400" />
                    <h3 className="text-sm font-bold text-nature-400 uppercase tracking-widest">Ricerche Salvate (Disponibili Offline)</h3>
                  </div>
                  {savedSearches.length > 0 && <WifiOff size={14} className="text-nature-300" />}
                </div>
                
                {savedSearches.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {savedSearches.map((saved) => (
                      <div
                        key={saved.id}
                        onClick={() => loadSavedSearch(saved)}
                        className="p-3 bg-white hover:bg-nature-50 rounded-2xl border border-nature-100 shadow-sm transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-nature-100 bg-nature-100 shrink-0">
                            {saved.imageUrl ? (
                              <img 
                                src={saved.imageUrl} 
                                alt={saved.query} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-nature-400">
                                <SearchIcon size={16} />
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-nature-900 truncate">{saved.query}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleDownload(saved, e)}
                            className="p-2 text-nature-300 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-all"
                            title="Scarica come file .txt"
                          >
                            <Download size={18} />
                          </button>
                          <div
                            onClick={(e) => handleDeleteSavedSearch(saved.id, e)}
                            className="p-2 text-nature-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                            title="Elimina"
                          >
                            <Trash2 size={18} />
                          </div>
                          <ChevronRight className="text-nature-200 group-hover:text-nature-400 transition-colors" size={20} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 border-2 border-dashed border-nature-100 rounded-[2rem] text-center">
                    <p className="text-nature-400 italic">Non hai ancora salvato nessuna ricerca.</p>
                    <p className="text-xs text-nature-300 mt-2">Fai una ricerca e clicca su "Salva per rileggere offline" per conservarla.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Slideshow 
        images={imageUrls}
        isOpen={showSlideshow}
        onClose={() => setShowSlideshow(false)}
        title={searchQuery}
      />
    </div>
  );
}
