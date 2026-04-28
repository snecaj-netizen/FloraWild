/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import { 
  auth, 
  db, 
  signIn, 
  signUp, 
  logout, 
  getUserRole 
} from './firebase';
import { Layout } from './components/Layout';
import { Navbar } from './components/Navbar';
import { Home } from './components/Home';
import { CameraView } from './components/CameraView';
import { Collection } from './components/Collection';
import { Search } from './components/Search';
import { PlantDetails } from './components/PlantDetails';
import { AdminPanel } from './components/AdminPanel';
import { ConfirmModal } from './components/ConfirmModal';
import { Plant, View, OperationType, SavedSearch } from './types';
import { identifyPlant, PlantIdentification } from './services/geminiService';
import { compressImage } from './lib/imageUtils';
import { Loader2, LogIn, Leaf, Shield, User as UserIcon, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';

const safeStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('LocalStorage access failed:', e);
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('LocalStorage set failed:', e);
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('LocalStorage remove failed:', e);
    }
  }
};

const IdentificationStatus = ({ isIdentifying, category }: { isIdentifying: boolean, category: 'plant' | 'mushroom' }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-6">
    <div className="relative">
      <div className="w-24 h-24 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      <Leaf className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-500" size={32} />
    </div>
    <p className="text-xl font-serif italic text-nature-600">
      Analizzando {category === 'plant' ? 'la pianta' : 'il fungo'}...
    </p>
  </div>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentView, setCurrentView] = useState<View>(() => {
    const saved = safeStorage.getItem('flora_view');
    const validViews: View[] = ['home', 'camera', 'collection', 'search', 'details'];
    if (saved && validViews.includes(saved as View)) {
      return saved as View;
    }
    return 'home';
  });
  const [plants, setPlants] = useState<Plant[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Identification state
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identifyingCategory, setIdentifyingCategory] = useState<'plant' | 'mushroom'>('plant');
  const [identifiedPlant, setIdentifiedPlant] = useState<PlantIdentification | null>(() => {
    const saved = safeStorage.getItem('flora_plant');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved plant:', e);
      return null;
    }
  });
  const [capturedImage, setCapturedImage] = useState<string | null>(() => {
    return safeStorage.getItem('flora_image');
  });
  const [lastPart, setLastPart] = useState<string>(() => {
    return safeStorage.getItem('flora_part') || 'Pianta intera';
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(() => {
    return safeStorage.getItem('flora_saved') === 'true';
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState<string | undefined>(undefined);

  // Persistence effects
  useEffect(() => {
    // Safety check: if in details view but missing data, go home
    if (currentView === 'details' && (!identifiedPlant || !capturedImage) && !isIdentifying) {
      setCurrentView('home');
    }
    safeStorage.setItem('flora_view', currentView);
  }, [currentView, identifiedPlant, capturedImage, isIdentifying]);

  useEffect(() => {
    if (identifiedPlant) {
      safeStorage.setItem('flora_plant', JSON.stringify(identifiedPlant));
    } else {
      safeStorage.removeItem('flora_plant');
    }
  }, [identifiedPlant]);

  useEffect(() => {
    if (capturedImage) {
      safeStorage.setItem('flora_image', capturedImage);
    } else {
      safeStorage.removeItem('flora_image');
    }
  }, [capturedImage]);

  useEffect(() => {
    safeStorage.setItem('flora_saved', String(isSaved));
  }, [isSaved]);

  useEffect(() => {
    safeStorage.setItem('flora_part', lastPart);
  }, [lastPart]);

  // Error handling
  const handleFirestoreError = (error: any, operationType: OperationType, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const role = await getUserRole(user.uid, user.email);
        setIsAdmin(role === 'admin');
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const key = (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!key || key === 'undefined' || key === 'null' || key.length < 20 || key.includes('Free Tier')) {
      console.warn("⚠️ Gemini API Key invalid or placeholder detected:", key);
    } else {
      console.log("✅ Gemini API Key detected (Prefix:", key.substring(0, 4), "Length:", key.length, ")");
    }
  }, []);

  useEffect(() => {
    if (!user || !isAuthReady) {
      setPlants([]);
      setSavedSearches([]);
      return;
    }

    const plantsPath = 'plants';
    const qPlants = query(
      collection(db, plantsPath),
      where('userId', '==', user.uid)
    );

    const unsubscribePlants = onSnapshot(qPlants, (snapshot) => {
      const plantsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Plant[];
      // Sort client-side to avoid composite index requirement
      setPlants(plantsData.sort((a, b) => b.createdAt - a.createdAt));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, plantsPath);
    });

    const searchesPath = 'saved_searches';
    const qSearches = query(
      collection(db, searchesPath),
      where('userId', '==', user.uid)
    );

    const unsubscribeSearches = onSnapshot(qSearches, (snapshot) => {
      const searchesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SavedSearch[];
      // Sort client-side to avoid composite index requirement
      setSavedSearches(searchesData.sort((a, b) => b.createdAt - a.createdAt));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, searchesPath);
    });

    return () => {
      unsubscribePlants();
      unsubscribeSearches();
    };
  }, [user, isAuthReady]);

  // Test connection
  useEffect(() => {
    if (isAuthReady && user) {
      const testConnection = async () => {
        try {
          await getDocFromServer(doc(db, 'test', 'connection'));
        } catch (error: any) {
          if (error.message?.includes('the client is offline')) {
            console.error("Please check your Firebase configuration.");
          }
        }
      };
      testConnection();
    }
  }, [isAuthReady, user]);

  const handleCapture = async (base64Image: string, category: 'plant' | 'mushroom', part: string) => {
    setCapturedImage(base64Image);
    setLastPart(part);
    setIdentifyingCategory(category);
    setIsIdentifying(true);
    setIsSaved(false);
    setIdentifiedPlant(null);
    setCurrentView('details');
    
    try {
      const compressedForAi = await compressImage(base64Image, 1024, 1024, 0.7);
      const result = await identifyPlant(compressedForAi, category, part);
      setIdentifiedPlant(result);
    } catch (error: any) {
      console.error("Identification failed:", error);
      alert(`Errore durante l'identificazione: ${error.message || "Riprova più tardi."}`);
      setCurrentView('home');
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleRefine = async (feedback: string) => {
    if (!capturedImage) return;
    
    setIdentifyingCategory(identifiedPlant?.category || 'plant');
    setIsIdentifying(true);
    setIdentifiedPlant(null);
    
    try {
      const compressedForAi = await compressImage(capturedImage, 1024, 1024, 0.7);
      const result = await identifyPlant(compressedForAi, identifiedPlant?.category || 'plant', lastPart, feedback);
      setIdentifiedPlant(result);
    } catch (error: any) {
      console.error("Refinement failed:", error);
      alert(`Errore durante il miglioramento: ${error.message || "Riprova più tardi."}`);
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleSavePlant = async () => {
    if (!user || !identifiedPlant || !capturedImage) return;
    
    setIsSaving(true);
    const path = 'plants';
    try {
      const compressedImage = await compressImage(capturedImage, 1024, 1024, 0.6);
      await addDoc(collection(db, path), {
        ...identifiedPlant,
        imageUrl: compressedImage,
        userId: user.uid,
        createdAt: Date.now()
      });
      setIsSaved(true);
    } catch (error) {
      console.error("Error in handleSavePlant:", error);
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlant = async (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const path = `plants/${deleteId}`;
    try {
      await deleteDoc(doc(db, 'plants', deleteId));
      setDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      if (isSigningUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (error: any) {
      let message = "Operazione fallita. Riprova.";
      console.error("Auth error code:", error.code);
      
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "Credenziali non valide. Per il primo accesso usa 'Registrati' con almeno 6 caratteri (es. Admin123).";
      } else if (error.code === 'auth/user-not-found') {
        message = "Utente non trovato. Usa 'Registrati' con una password di almeno 6 caratteri (es. Admin123).";
      } else if (error.code === 'auth/email-already-in-use') {
        message = "Email già registrata. Se non ricordi la password, riprova con 'Registrati' usando un'altra email o contatta l'assistenza.";
      } else if (error.code === 'auth/weak-password') {
        message = "La password deve avere almeno 6 caratteri (es. Admin123).";
      } else if (error.code === 'auth/invalid-email') {
        message = "Formato email non valido.";
      } else if (error.code === 'auth/operation-not-allowed') {
        message = "L'accesso con Email/Password non è abilitato nella console Firebase.";
      }
      setAuthError(message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutConfirm(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center nature-gradient">
        <Loader2 className="animate-spin text-nature-600" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-nature-600 p-8 text-white text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Leaf size={32} />
            </div>
            <h1 className="text-3xl font-serif font-bold">FloraWild</h1>
            <p className="text-white/80 mt-2 italic">Il tuo compagno nella natura</p>
          </div>

          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 text-center">
              {isSigningUp ? 'Crea un account' : 'Bentornato'}
            </h2>

            {authError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{authError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                    placeholder="esempio@Email.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-12 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full bg-nature-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-nature-100 hover:bg-nature-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {isAuthLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <LogIn size={20} />
                  {isSigningUp ? 'Registrati' : 'Accedi'}
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSigningUp(!isSigningUp);
                  setAuthError(null);
                }}
                className="text-nature-600 font-bold hover:underline"
              >
                {isSigningUp ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="relative">
          {currentView === 'admin' && isAdmin && (
            <AdminPanel onBack={() => setCurrentView('home')} />
          )}

          {currentView === 'home' && (
            <Home 
              onStartIdentify={() => setCurrentView('camera')}
              onGoToCollection={() => setCurrentView('collection')}
              onGoToSearch={(query) => {
                setSearchInitialQuery(query);
                setCurrentView('search');
              }}
              savedSearches={savedSearches}
            />
          )}

          {currentView === 'camera' && (
            <CameraView 
              onCapture={handleCapture}
              onClose={() => setCurrentView('home')}
            />
          )}

          {currentView === 'collection' && (
            <Collection 
              plants={plants}
              onSelect={(plant) => {
                setIdentifiedPlant(plant);
                setCapturedImage(plant.imageUrl);
                setIsSaved(true);
                setCurrentView('details');
              }}
              onDelete={handleDeletePlant}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          )}

          {currentView === 'search' && (
            <Search 
              user={user}
              onFirestoreError={handleFirestoreError}
              initialQuery={searchInitialQuery} 
            />
          )}

          {currentView === 'details' && (
            <div className="relative">
              {isIdentifying ? (
                <IdentificationStatus 
                  isIdentifying={isIdentifying} 
                  category={identifyingCategory} 
                />
              ) : identifiedPlant && capturedImage ? (
                <PlantDetails 
                  plant={identifiedPlant}
                  imageUrl={capturedImage}
                  onSave={handleSavePlant}
                  onBack={() => {
                    setIdentifiedPlant(null);
                    setCapturedImage(null);
                    setCurrentView(isSaved ? 'collection' : 'home');
                  }}
                  onRedo={() => setCurrentView('camera')}
                  onRefine={handleRefine}
                  onSearchQuery={(query) => {
                    setSearchInitialQuery(query);
                    setCurrentView('search');
                  }}
                  isSaving={isSaving}
                  isSaved={isSaved}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-nature-400 text-center">
                  <p className="italic">Dati identificazione non trovati.</p>
                  <button 
                    onClick={() => setCurrentView('home')}
                    className="text-brand-600 font-bold underline"
                  >
                    Torna alla Home
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <Navbar 
          currentView={currentView} 
          onViewChange={(view) => {
            if (view === 'search') setSearchInitialQuery(undefined);
            setCurrentView(view);
          }} 
        />
        
        <ConfirmModal 
          isOpen={!!deleteId}
          title="Elimina Pianta"
          message="Sei sicuro di voler eliminare questa pianta dalla tua collezione? L'azione non può essere annullata."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
          confirmText="Elimina definitivamente"
          variant="danger"
        />

        <ConfirmModal 
          isOpen={showLogoutConfirm}
          title="Esci dall'account"
          message="Sei sicuro di voler uscire? Dovrai accedere nuovamente per vedere la tua collezione."
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
          confirmText="Esci ora"
          variant="primary"
        />

        {currentView === 'home' && (
          <div className="fixed top-4 right-4 flex gap-2 z-40">
            {isAdmin && (
              <button 
                onClick={() => setCurrentView('admin')}
                className="p-2 bg-white/50 backdrop-blur-sm rounded-full text-brand-600 hover:text-brand-800 transition-all border border-brand-100"
              >
                <Shield size={18} />
              </button>
            )}
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 bg-white/50 backdrop-blur-sm rounded-full text-nature-400 hover:text-nature-600 transition-all border border-brand-100"
            >
              <LogIn size={18} className="rotate-180" />
            </button>
          </div>
        )}
      </Layout>
  );
}
