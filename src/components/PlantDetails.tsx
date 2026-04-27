import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, AlertTriangle, Utensils, Heart, Save, ArrowLeft, Info, RefreshCw, Share2, Sparkles, Loader2, Image as ImageIcon, ExternalLink, Search, Maximize2 } from 'lucide-react';
import { PlantIdentification } from '@/src/services/geminiService';
import { cn } from '@/src/lib/utils';
import * as htmlToImage from 'html-to-image';

import { SharePreviewModal } from './SharePreviewModal';
import { Slideshow } from './Slideshow';

interface PlantDetailsProps {
  plant: PlantIdentification;
  imageUrl: string;
  onSave: () => void;
  onBack: () => void;
  onRedo: () => void;
  onRefine: (feedback: string) => void;
  onSearchQuery: (query: string) => void;
  isSaving?: boolean;
  isSaved?: boolean;
}

export function PlantDetails({ plant, imageUrl, onSave, onBack, onRedo, onRefine, onSearchQuery, isSaving, isSaved }: PlantDetailsProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [feedback, setFeedback] = useState('');
  
  // Botanical Gallery State
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);

  useEffect(() => {
    const fetchBotanicalImages = async () => {
      if (!plant.scientificName) return;
      setIsLoadingGallery(true);
      try {
        // Fetch from GBIF API (Global Biodiversity Information Facility)
        const response = await fetch(`https://api.gbif.org/v1/occurrence/search?scientificName=${encodeURIComponent(plant.scientificName)}&mediaType=StillImage&limit=6`);
        const data = await response.json();
        
        const images = data.results
          .flatMap((r: any) => r.media)
          .filter((m: any) => m.type === 'StillImage')
          .map((m: any) => m.identifier)
          .filter((url: string) => url && (url.startsWith('http') || url.startsWith('https')));
          
        setGalleryImages(Array.from(new Set(images)).slice(0, 6) as string[]);
      } catch (err) {
        console.error("Error fetching botanical gallery:", err);
      } finally {
        setIsLoadingGallery(false);
      }
    };

    fetchBotanicalImages();
  }, [plant.scientificName]);

  const handleRefineSubmit = () => {
    if (!feedback.trim()) return;
    onRefine(feedback);
    setIsRefining(false);
    setFeedback('');
  };

  const generatePreview = async () => {
    if (!cardRef.current) return;
    
    setIsGenerating(true);
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 0.95,
        backgroundColor: '#f8fafc',
        style: {
          borderRadius: '0',
          transform: 'scale(1)',
        }
      });
      setPreviewImage(dataUrl);
    } catch (err) {
      console.error("Error generating preview:", err);
      alert("Errore durante la creazione dell'anteprima.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExecuteShare = async () => {
    if (!previewImage) return;
    
    setIsSharing(true);
    try {
      const blob = await (await fetch(previewImage)).blob();
      const file = new File([blob], `FloraWild_${plant.name.replace(/\s+/g, '_')}.png`, { type: 'image/png' });

      const shareData: ShareData = {
        title: `FloraWild: ${plant.name}`,
        text: `Guarda cosa ho trovato con FloraWild! È una ${plant.name} (${plant.scientificName}).`,
        files: [file],
        url: window.location.origin
      };

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share(shareData);
        setPreviewImage(null);
      } else {
        const link = document.createElement('a');
        link.download = `FloraWild_${plant.name}.png`;
        link.href = previewImage;
        link.click();
        alert("Immagine scaricata! Puoi condividerla manualmente.");
      }
    } catch (err) {
      console.error("Error sharing:", err);
      if (err instanceof Error && err.name !== 'AbortError') {
        alert("Errore durante la condivisione.");
      }
    } finally {
      setIsSharing(false);
    }
  };

  const openSlideshow = (index: number) => {
    setSlideshowIndex(index);
    setShowSlideshow(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="space-y-6"
    >
      {/* Hidden Card for Image Generation */}
      <div className="fixed -left-[9999px] top-0">
        <div 
          ref={cardRef} 
          className="w-[400px] bg-slate-50 p-8 flex flex-col gap-6 font-sans"
          style={{ minHeight: '600px' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Sparkles className="text-white" size={20} />
            </div>
            <div>
              <h4 className="font-serif font-bold text-slate-900 leading-none">FloraWild</h4>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Identificazione {plant.category === 'plant' ? 'Botanica' : 'Micologica'}</p>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden aspect-square shadow-lg">
            <img src={imageUrl} alt={plant.name} className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent text-white">
              <h2 className="text-2xl font-serif leading-tight">{plant.name}</h2>
              <p className="text-xs italic opacity-80">{plant.scientificName}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className={cn(
              "p-4 rounded-2xl flex items-center gap-3",
              plant.isEdible ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            )}>
              {plant.isEdible ? <Check size={20} /> : <AlertTriangle size={20} />}
              <p className="font-bold text-sm">{plant.isEdible ? 'Commestibile' : 'Non Commestibile'}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Descrizione</h5>
              <p className="text-slate-600 text-xs leading-relaxed line-clamp-4">{plant.description}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Consiglio di Riconoscimento</h5>
              <p className="text-slate-600 text-xs leading-relaxed italic">
                "{typeof plant.recognitionTips?.[0] === 'string' ? plant.recognitionTips?.[0] : plant.recognitionTips?.[0]?.text}"
              </p>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-slate-200 flex justify-between items-center">
            <p className="text-[10px] text-slate-400">Scansionato con FloraWild AI</p>
            <p className="text-[10px] font-bold text-emerald-600">florawild.app</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-4">
        <div className="flex justify-between items-center">
          <button onClick={onBack} className="flex items-center gap-2 text-nature-500 font-medium">
            <ArrowLeft size={20} />
            Torna indietro
          </button>
          {!isSaved && (
            <div className="flex gap-2">
              <button 
                onClick={() => setIsRefining(!isRefining)} 
                className={cn(
                  "flex items-center gap-2 font-medium text-sm px-3 py-1.5 rounded-full transition-colors",
                  isRefining ? "bg-brand-500 text-white" : "bg-brand-100 text-brand-600 hover:bg-brand-200"
                )}
              >
                <Sparkles size={16} />
                Migliora
              </button>
              <button 
                onClick={onRedo} 
                className="flex items-center gap-2 text-nature-600 font-medium text-sm bg-nature-100 px-3 py-1.5 rounded-full hover:bg-nature-200 transition-colors"
              >
                <RefreshCw size={16} />
                Rifai foto
              </button>
            </div>
          )}
        </div>

        <AnimatePresence>
          {isRefining && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-brand-50 p-4 rounded-2xl border border-brand-100 space-y-3">
                <p className="text-xs font-bold text-brand-800 uppercase tracking-wider">Aiuta l'IA a identificare meglio</p>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Es: 'I fiori sono gialli', 'Cresce vicino a un fiume', 'Le foglie sono pelose'..."
                  className="w-full p-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm min-h-[80px]"
                />
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => setIsRefining(false)}
                    className="px-4 py-2 text-sm font-medium text-nature-500"
                  >
                    Annulla
                  </button>
                  <button 
                    onClick={handleRefineSubmit}
                    disabled={!feedback.trim()}
                    className="bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm disabled:opacity-50"
                  >
                    Invia suggerimento
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-square">
        <img src={imageUrl} alt={plant.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
          <h1 className="text-3xl font-serif mb-1">{plant.name}</h1>
          <p className="text-sm italic opacity-80">{plant.scientificName}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className={cn(
          "flex-1 p-4 rounded-2xl flex items-center gap-3",
          plant.isEdible ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        )}>
          {plant.isEdible ? <Check size={24} /> : <AlertTriangle size={24} />}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">Commestibilità</p>
            <p className="font-medium">{plant.isEdible ? 'Commestibile' : 'Non Commestibile'}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={generatePreview}
            disabled={isGenerating}
            className="p-4 rounded-2xl flex items-center justify-center bg-white border border-nature-200 text-nature-600 hover:bg-nature-50 transition-all disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={24} /> : <Share2 size={24} />}
          </button>
          
          <button
            onClick={onSave}
            disabled={isSaving || isSaved}
            className={cn(
              "p-4 rounded-2xl flex items-center justify-center transition-all",
              isSaved ? "bg-nature-600 text-white" : "bg-brand-500 text-white hover:bg-brand-600 shadow-lg shadow-brand-100"
            )}
          >
            {isSaved ? <Check size={24} /> : <Save size={24} />}
          </button>
        </div>
      </div>

      <SharePreviewModal 
        isOpen={!!previewImage}
        image={previewImage}
        onConfirm={handleExecuteShare}
        onCancel={() => setPreviewImage(null)}
        isSharing={isSharing}
      />

      {plant.warning && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 text-amber-800">
          <AlertTriangle size={24} className="shrink-0" />
          <p className="text-sm">{plant.warning}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Recognition Tips Section */}
        <section className="glass-card p-6 rounded-3xl border-l-4 border-l-nature-400">
          <h3 className="text-lg font-serif mb-4 flex items-center gap-2 text-nature-800">
            <Info size={20} className="text-nature-500" />
            Consigli per il riconoscimento
          </h3>
          <div className="space-y-6">
            {plant.recognitionTips?.map((tip, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-nature-100 text-nature-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-nature-700 text-sm leading-relaxed">
                    {typeof tip === 'string' ? tip : tip.text}
                  </p>
                </div>
                {typeof tip !== 'string' && tip.imageSearchTerm && (
                  <div className="ml-8">
                    <a 
                      href={`https://www.google.com/search?q=${encodeURIComponent(plant.name + ' ' + tip.imageSearchTerm)}&tbm=isch`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-nature-50 hover:bg-nature-100 text-nature-600 text-xs font-bold rounded-xl border border-nature-200 transition-all group"
                    >
                      <Search size={14} className="group-hover:scale-110 transition-transform" />
                      Vedi esempio reale
                      <ExternalLink size={12} className="opacity-50" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Botanical Gallery Section */}
        <section className="glass-card p-6 rounded-3xl">
          <h3 className="text-lg font-serif mb-4 flex items-center gap-2 text-nature-800">
            <ImageIcon size={20} className="text-nature-500" />
            Galleria {plant.category === 'plant' ? 'Botanica' : 'Micologica'} (GBIF)
          </h3>
          
          {isLoadingGallery ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-nature-300" size={32} />
            </div>
          ) : galleryImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {galleryImages.map((url, i) => (
                <div 
                  key={i} 
                  className="aspect-square rounded-2xl overflow-hidden bg-nature-50 border border-nature-100 relative group cursor-zoom-in"
                  onClick={() => openSlideshow(i)}
                >
                  <img 
                    src={url} 
                    alt={`${plant.name} gallery ${i}`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute top-2 right-2 p-1.5 bg-white/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 size={14} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-nature-50 rounded-2xl border border-dashed border-nature-200">
              <p className="text-xs text-nature-400 italic">Nessuna immagine scientifica trovata per questa specie.</p>
            </div>
          )}
          <p className="text-[9px] text-nature-400 mt-4 text-center italic">
            Immagini fornite da GBIF.org - Global Biodiversity Information Facility
          </p>
        </section>

        <section className="glass-card p-6 rounded-3xl">
          <h3 className="text-lg font-serif mb-3 flex items-center gap-2">
            <Utensils size={20} className="text-brand-500" />
            Usi in Cucina
          </h3>
          <div className="flex flex-wrap gap-2">
            {plant.culinaryUses?.map((use, i) => (
              <button 
                key={i} 
                onClick={() => onSearchQuery(use.title)}
                className="inline-flex items-center gap-2 bg-brand-50 text-brand-800 px-4 py-2 rounded-xl text-sm hover:bg-brand-100 transition-colors border border-brand-100"
              >
                {use.title}
                <Sparkles size={14} className="opacity-50" />
              </button>
            ))}
          </div>
        </section>

        {plant.category === 'plant' ? (
          <section className="glass-card p-6 rounded-3xl">
            <h3 className="text-lg font-serif mb-3 flex items-center gap-2">
              <Heart size={20} className="text-nature-500" />
              Fitoterapia
            </h3>
            <div className="flex flex-wrap gap-2">
              {plant.phytotherapyUses?.map((use, i) => (
                <button 
                  key={i} 
                  onClick={() => onSearchQuery(use.title)}
                  className="inline-flex items-center gap-2 bg-nature-50 text-nature-800 px-4 py-2 rounded-xl text-sm hover:bg-nature-100 transition-colors border border-nature-100"
                >
                  {use.title}
                  <Sparkles size={14} className="opacity-50" />
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="glass-card p-6 rounded-3xl">
            <h3 className="text-lg font-serif mb-3 flex items-center gap-2 text-nature-800">
              <Info size={20} className="text-nature-500" />
              Habitat & Stagione
            </h3>
            <p className="text-sm text-nature-600 italic">
              Le informazioni micologiche richiedono prudenza estrema. Non consumare mai funghi identificati solo tramite app.
            </p>
          </section>
        )}

        <section className="p-6">
          <h3 className="text-lg font-serif mb-2">Descrizione</h3>
          <p className="text-nature-600 text-sm leading-relaxed">{plant.description}</p>
        </section>
      </div>

      <Slideshow 
        images={galleryImages}
        initialIndex={slideshowIndex}
        isOpen={showSlideshow}
        onClose={() => setShowSlideshow(false)}
        title={plant.scientificName}
      />
    </motion.div>
  );
}
