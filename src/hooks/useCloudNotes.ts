import { useState, useEffect } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged, 
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { Note } from '../types';

export function useCloudNotes(initialLocalNotes: Note[]) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [cloudNotes, setCloudNotes] = useState<Note[] | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Monitor Auth state
  useEffect(() => {
    // Check redirect login results if popup was blocked
    getRedirectResult(auth).catch((err) => {
      console.warn('Auth redirect result:', err);
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync notes from Firestore when logged in
  useEffect(() => {
    if (!currentUser) {
      setCloudNotes(null);
      return;
    }

    setIsSyncing(true);
    const notesCollectionRef = collection(db, 'users', currentUser.uid, 'notes');

    const unsubscribe = onSnapshot(
      notesCollectionRef,
      (snapshot) => {
        const loaded: Note[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loaded.push({
            id: docSnap.id,
            title: data.title || '',
            content: data.content || '',
            category: data.category || 'Общее',
            isPinned: Boolean(data.isPinned),
            createdAt: data.createdAt ? Number(data.createdAt) : Date.now(),
            updatedAt: data.updatedAt ? Number(data.updatedAt) : Date.now(),
          });
        });

        // If user has 0 notes in cloud, migrate their local initial notes so they don't lose anything
        if (snapshot.empty && initialLocalNotes.length > 0) {
          const batch = writeBatch(db);
          initialLocalNotes.forEach((n) => {
            const docRef = doc(db, 'users', currentUser.uid, 'notes', n.id);
            batch.set(docRef, {
              userId: currentUser.uid,
              title: n.title,
              content: n.content,
              category: n.category,
              isPinned: n.isPinned,
              createdAt: n.createdAt,
              updatedAt: n.updatedAt,
              syncedAt: serverTimestamp(),
            });
          });
          batch.commit().catch((err) => {
            console.error('Failed to migrate local notes to cloud:', err);
          });
        }

        setCloudNotes(loaded);
        setIsSyncing(false);
        setSyncError(null);
      },
      (err) => {
        console.error('Firestore sync error:', err);
        setSyncError('Ошибка синхронизации. Проверьте сеть.');
        setIsSyncing(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Login with Google
  const signInWithGoogle = async () => {
    try {
      setSyncError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      // If popup was blocked by browser, try redirect
      if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr) {
          console.error('Redirect sign in error:', redirectErr);
        }
      }
      console.error('Sign in error:', err);
      setSyncError('Не удалось войти через Google. Попробуйте еще раз.');
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setCloudNotes(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Save or update note in cloud
  const saveCloudNote = async (note: Note) => {
    if (!currentUser) return;
    try {
      const docRef = doc(db, 'users', currentUser.uid, 'notes', note.id);
      await setDoc(docRef, {
        userId: currentUser.uid,
        title: note.title,
        content: note.content,
        category: note.category,
        isPinned: note.isPinned,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        syncedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to save note to cloud:', err);
    }
  };

  // Delete note in cloud
  const deleteCloudNote = async (noteId: string) => {
    if (!currentUser) return;
    try {
      const docRef = doc(db, 'users', currentUser.uid, 'notes', noteId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Failed to delete note from cloud:', err);
    }
  };

  return {
    currentUser,
    isAuthLoading,
    cloudNotes,
    isSyncing,
    syncError,
    signInWithGoogle,
    signOut,
    saveCloudNote,
    deleteCloudNote,
  };
}
