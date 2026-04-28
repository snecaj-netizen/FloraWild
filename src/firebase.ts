import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const ADMIN_EMAIL = 'snecaj@gmail.com';

export const signIn = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    throw error;
  }
};

export const signUp = async (email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user profile in Firestore
    await setDoc(doc(db, 'users', result.user.uid), {
      email,
      role: email === ADMIN_EMAIL ? 'admin' : 'user',
      createdAt: serverTimestamp()
    });

    return result.user;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const getUserRole = async (uid: string, email?: string | null) => {
  const userDocRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userDocRef);
  
  if (userDoc.exists()) {
    const data = userDoc.data();
    // Force admin role for the specific email if it's not set correctly
    if (email === ADMIN_EMAIL && data.role !== 'admin') {
      await updateDoc(userDocRef, { role: 'admin' });
      return 'admin';
    }
    return data.role;
  }

  // If doc doesn't exist but it's the admin email, create it
  if (email === ADMIN_EMAIL) {
    await setDoc(userDocRef, {
      email,
      role: 'admin',
      createdAt: serverTimestamp()
    });
    return 'admin';
  }
  
  return 'user';
};
