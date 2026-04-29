import React, { useRef, useState } from 'react';
import { Camera, Upload, RefreshCw, X, Leaf, Flower, Apple, TreeDeciduous, Loader2, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import EXIF from 'exif-js';

interface CameraViewProps {
  onCapture: (base64Image: string, category: 'plant' | 'mushroom', part: string, location?: { lat: number; lng: number }) => void;
  onClose: () => void;
  initialImage?: string | null;
}

export function CameraView({ onCapture, onClose, initialImage }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'plant' | 'mushroom'>('plant');
  const [selectedPart, setSelectedPart] = useState<string>('Intero');
  const [tempImage, setTempImage] = useState<string | null>(initialImage || null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const plantParts = [
    { 
      id: 'Pianta intera', 
      icon: Leaf, 
      label: 'Intera',
      tips: 'Inquadra l\'intera struttura per mostrare il portamento e l\'ambiente.'
    },
    { 
      id: 'Foglia', 
      icon: Leaf, 
      label: 'Foglia',
      tips: 'Metti a fuoco una foglia nitida, preferibilmente su uno sfondo neutro.'
    },
    { 
      id: 'Fiore', 
      icon: Flower, 
      label: 'Fiore',
      tips: 'Avvicinati per mostrare petali e stami. La luce naturale è ideale.'
    },
    { 
      id: 'Frutto', 
      icon: Apple, 
      label: 'Frutto',
      tips: 'Mostra il frutto e, se possibile, come è attaccato alla pianta.'
    },
    { 
      id: 'Tronco/Corteccia', 
      icon: TreeDeciduous, 
      label: 'Tronco',
      tips: 'Cattura la trama della corteccia evitando riflessi o ombre forti.'
    },
  ];

  const mushroomParts = [
    { 
      id: 'Fungo intero', 
      icon: Loader2, 
      label: 'Intero',
      tips: 'Mostra il fungo nel suo habitat naturale per vederne la forma completa.'
    },
    { 
      id: 'Cappello', 
      icon: Apple, 
      label: 'Cappello',
      tips: 'Inquadra dall\'alto per mostrare il colore, la trama e il bordo del cappello.'
    },
    { 
      id: 'Lamelle/Imenoforo', 
      icon: RefreshCw, 
      label: 'Lamelle',
      tips: 'Fondamentale! Mostra la parte sotto il cappello (lamelle, tubuli o aculei).'
    },
    { 
      id: 'Gambo/Base', 
      icon: TreeDeciduous, 
      label: 'Base',
      tips: 'Mostra la base del gambo per identificare eventuale volva o bulbo.'
    },
    { 
      id: 'Sezione', 
      icon: X, 
      label: 'Taglio',
      tips: 'Se possibile, mostra il colore della carne al taglio (viraggio).'
    },
  ];

  const parts = activeCategory === 'plant' ? plantParts : mushroomParts;

  const [cameraError, setCameraError] = useState<string | null>(null);

  // Use useEffect to assign stream when video element is ready
  React.useEffect(() => {
    if (isCameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraActive, stream]);

  const requestLocation = () => {
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Location error:", error);
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setLocation(undefined); // Reset location for new capture session
    requestLocation(); // Pre-emptive location request
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Il tuo browser non supporta l'accesso alla fotocamera.");
      }

      // First try environment (back) camera
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false,
        });
      } catch (e) {
        // Fallback to any available camera
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }
      
      setStream(mediaStream);
      setIsCameraActive(true);
      setTempImage(null);
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      let message = "Impossibile accedere alla fotocamera.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = "Permesso negato. Controlla le impostazioni del browser (l'icona del lucchetto in alto) e consenti l'accesso alla fotocamera.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = "Nessuna fotocamera trovata su questo dispositivo.";
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = "La fotocamera è già in uso da un'altra applicazione o il browser la sta bloccando.";
      }
      setCameraError(message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg');
        setTempImage(base64);
        stopCamera();
        if (!location) requestLocation();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLocation(undefined); // Reset location to ensure we ONLY use EXIF for uploads
      setIsGettingLocation(false);
      
      // Try to get EXIF
      EXIF.getData(file as any, function(this: any) {
        const lat = EXIF.getTag(this, "GPSLatitude");
        const lon = EXIF.getTag(this, "GPSLongitude");
        const latRef = EXIF.getTag(this, "GPSLatitudeRef") || "N";
        const lonRef = EXIF.getTag(this, "GPSLongitudeRef") || "E";

        if (lat && lon) {
          const latitude = (lat[0] + lat[1] / 60 + lat[2] / 3600) * (latRef === "N" ? 1 : -1);
          const longitude = (lon[0] + lon[1] / 60 + lon[2] / 3600) * (lonRef === "E" ? 1 : -1);
          setLocation({ lat: latitude, lng: longitude });
        }
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result as string);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (tempImage) {
      onCapture(tempImage, activeCategory, selectedPart, location);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black z-[100] flex flex-col"
    >
      <div className="p-4 flex justify-between items-center text-white z-10">
        <h2 className="text-lg font-serif italic">Identifica {activeCategory === 'plant' ? 'Pianta' : 'Fungo'}</h2>
        <button onClick={() => { stopCamera(); onClose(); }} className="p-2 hover:bg-white/10 rounded-full">
          <X size={24} />
        </button>
      </div>

      <div className="flex px-4 py-2 gap-4 z-10">
        <button
          onClick={() => setActiveCategory('plant')}
          className={cn(
            "flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all border",
            activeCategory === 'plant' ? "bg-white text-brand-900 border-white" : "bg-white/10 text-white border-white/20"
          )}
        >
          Piante
        </button>
        <button
          onClick={() => setActiveCategory('mushroom')}
          className={cn(
            "flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all border",
            activeCategory === 'mushroom' ? "bg-white text-brand-900 border-white" : "bg-white/10 text-white border-white/20"
          )}
        >
          Funghi
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {isCameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover bg-black"
          />
        ) : tempImage ? (
          <div className="w-full h-full relative">
            <img src={tempImage} className="w-full h-full object-cover" alt="Captured" />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-6">
              <div className="bg-white rounded-3xl p-6 w-full max-w-xs space-y-6 shadow-2xl overflow-y-auto max-h-full">
                <div className="text-center">
                  <h3 className="text-xl font-serif text-nature-900">Cosa hai fotografato?</h3>
                  <p className="text-sm text-nature-500">Seleziona la parte per migliorare il riconoscimento</p>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {parts.map((part) => (
                    <button
                      key={part.id}
                      onClick={() => setSelectedPart(part.id)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border-2",
                        selectedPart === part.id 
                          ? "bg-brand-50 border-brand-500 text-brand-700" 
                          : "bg-nature-50 border-transparent text-nature-400"
                      )}
                    >
                      <part.icon size={20} />
                      <span className="text-[10px] font-bold uppercase">{part.label}</span>
                    </button>
                  ))}
                </div>

                {/* Location indicator */}
                <div className={cn(
                  "flex items-center gap-2 p-3 rounded-xl border text-[11px] transition-all",
                  location 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold" 
                    : isGettingLocation 
                      ? "bg-blue-50 border-blue-200 text-blue-700 animate-pulse"
                      : "bg-nature-50 border-nature-100 text-nature-500"
                )}>
                  <MapPin size={14} />
                  <span>
                    {location 
                      ? `Coordinate acquisite (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})` 
                      : isGettingLocation 
                        ? "Acquisizione posizione..." 
                        : "Posizione non acquisita"}
                  </span>
                </div>

                <div className="bg-nature-50 p-3 rounded-xl border border-nature-100">
                  <p className="text-[11px] text-nature-600 italic text-center">
                    <span className="font-bold text-nature-800 not-italic">Consiglio:</span> {parts.find(p => p.id === selectedPart)?.tips}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleConfirm}
                    className="w-full bg-brand-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-brand-100 active:scale-95 transition-all"
                  >
                    Conferma e Identifica
                  </button>
                  <button
                    onClick={() => { setTempImage(null); startCamera(); }}
                    className="w-full bg-nature-100 text-nature-700 py-3 rounded-2xl font-medium text-sm"
                  >
                    Rifai foto
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 max-w-sm">
            <div className="w-20 h-20 bg-nature-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Camera size={32} className="text-nature-300" />
            </div>
            <h3 className="text-white text-xl font-serif mb-2">Pronto a esplorare?</h3>
            <p className="text-nature-400 mb-8 text-sm">Inquadra il soggetto o carica una foto dalla galleria per iniziare l'identificazione.</p>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 text-left space-y-3">
              <h4 className="text-xs font-bold text-brand-400 uppercase tracking-widest">Suggerimenti per foto migliori:</h4>
              <ul className="text-[11px] text-nature-300 space-y-2">
                <li className="flex gap-2">
                  <span className="text-brand-500">•</span>
                  <span><strong>Luce:</strong> Evita il sole diretto troppo forte o il buio pesto.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-brand-500">•</span>
                  <span><strong>Fuoco:</strong> Assicurati che il soggetto sia nitido e non mosso.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-brand-500">•</span>
                  <span><strong>Dettaglio:</strong> Avvicinati al fiore o alla foglia per mostrare i particolari.</span>
                </li>
              </ul>
            </div>

            {cameraError && (
              <div className="mb-6 space-y-4">
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-200 text-sm">
                  {cameraError}
                </div>
                {cameraError.includes("Permesso negato") && (
                  <div className="text-left bg-white/5 p-4 rounded-2xl border border-white/10 text-xs text-nature-300 space-y-2">
                    <p className="font-bold text-white uppercase tracking-wider">Come risolvere:</p>
                    <ol className="list-decimal ml-4 space-y-1">
                      <li>Clicca sull'icona del <strong>lucchetto</strong> o dei <strong>cursori</strong> accanto all'indirizzo del sito in alto.</li>
                      <li>Trova la voce <strong>Fotocamera</strong> e sposta la levetta su <strong>ON</strong>.</li>
                      <li>Ricarica la pagina se richiesto dal browser.</li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <button
                onClick={startCamera}
                className="bg-brand-500 text-white px-8 py-3 rounded-full font-medium flex items-center justify-center gap-2"
              >
                <Camera size={20} />
                Attiva Fotocamera
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/10 text-white px-8 py-3 rounded-full font-medium flex items-center justify-center gap-2 border border-white/20"
              >
                <Upload size={20} />
                Carica Foto
              </button>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {isCameraActive && (
        <div className="p-8 flex justify-center items-center gap-8 bg-black/50 backdrop-blur-sm">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-4 bg-white/10 rounded-full text-white"
          >
            <Upload size={24} />
          </button>
          <button
            onClick={capturePhoto}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-nature-500"
          >
            <div className="w-16 h-16 bg-white rounded-full border-2 border-nature-900" />
          </button>
          <button
            onClick={stopCamera}
            className="p-4 bg-white/10 rounded-full text-white"
          >
            <RefreshCw size={24} />
          </button>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />
    </motion.div>
  );
}
