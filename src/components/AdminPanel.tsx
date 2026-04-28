import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Shield, User, Trash2, Mail, Calendar, ArrowLeft } from 'lucide-react';
import { handleFirestoreError } from '../lib/utils';
import { OperationType } from '../types';

interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: any;
}

export const AdminPanel = ({ onBack }: { onBack: () => void }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, []);

  const toggleRole = async (user: UserProfile) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const path = `users/${user.id}`;
    try {
      await updateDoc(doc(db, 'users', user.id), {
        role: newRole
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteUser = async (userId: string) => {
    if (userId === auth.currentUser?.uid) {
      alert("Non puoi eliminare te stesso!");
      return;
    }

    if (window.confirm("Sei sicuro di voler eliminare questo utente? Questa operazione è irreversibile per il profilo Firestore.")) {
      const path = `users/${userId}`;
      try {
        await deleteDoc(doc(db, 'users', userId));
      } catch (error: any) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Shield className="text-brand-600" size={24} />
              Gestione Utenti
            </h1>
          </div>
          <div className="text-slate-500 text-sm font-medium">
            {users.length} utenti registrati
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4">
            {users.map(user => (
              <div 
                key={user.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    user.role === 'admin' ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {user.role === 'admin' ? <Shield size={24} /> : <User size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      {user.email}
                      {user.role === 'admin' && (
                        <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1">
                        <Mail size={12} /> {user.id.substring(0, 8)}...
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleRole(user)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      user.role === 'admin' 
                        ? 'text-slate-600 hover:bg-slate-100' 
                        : 'text-brand-600 hover:bg-brand-50'
                    }`}
                  >
                    {user.role === 'admin' ? 'Rendi Utente' : 'Rendi Admin'}
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
