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
  
  // Private notes of the user
  const [cloudNotes, setCloudNotes] = useState<Note[] | null>(null);
  
  // Public notes created by guests or users (visible to all guests)
  const [publicNotes, setPublicNotes] = useState<Note[]>([]);
  const [isPublicLoading, setIsPublicLoading] = useState(true);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Helper to safely parse timestamp
  const parseTimestamp = (val: unknown): number => {
    if (!val) return Date.now();
    if (typeof val === 'number' && !isNaN(val)) return val;
    if (typeof val === 'object' && val !== null && 'toMillis' in val) {
      return (val as { toMillis: () => number }).toMillis();
    }
    const parsed = Number(val);
    return isNaN(parsed) ? Date.now() : parsed;
  };

  // 1. Monitor Auth state
  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      console.warn('Auth redirect result:', err);
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time listener for PUBLIC NOTES (guest wall, visible to all)
  useEffect(() => {
    try {
      const publicColRef = collection(db, 'public_notes');

      const unsubscribe = onSnapshot(
        publicColRef,
        (snapshot) => {
          const loaded: Note[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            loaded.push({
              id: docSnap.id,
              title: String(data.title || ''),
              content: String(data.content || ''),
              category: data.category || 'Общее',
              isPinned: Boolean(data.isPinned),
              isPublic: true,
              authorName: String(data.authorName || 'Гость'),
              authorId: String(data.authorId || ''),
              createdAt: parseTimestamp(data.createdAt),
              updatedAt: parseTimestamp(data.updatedAt),
            });
          });

          // Sort: pinned first, then newest
          loaded.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
          });

          setPublicNotes(loaded);
          setIsPublicLoading(false);
        },
        (err) => {
          console.error('Public notes snapshot error:', err);
          setIsPublicLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Failed to init public notes listener:', err);
      setIsPublicLoading(false);
    }
  }, []);

  // 3. Real-time listener for PRIVATE NOTES when user is logged in
  useEffect(() => {
    if (!currentUser) {
      setCloudNotes(null);
      return;
    }

    setIsSyncing(true);
    try {
      const notesCollectionRef = collection(db, 'users', currentUser.uid, 'notes');

      const unsubscribe = onSnapshot(
        notesCollectionRef,
        (snapshot) => {
          const loaded: Note[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            loaded.push({
              id: docSnap.id,
              title: String(data.title || ''),
              content: String(data.content || ''),
              category: data.category || 'Общее',
              isPinned: Boolean(data.isPinned),
              isPublic: false,
              authorName: currentUser.displayName || currentUser.email || 'Я',
              createdAt: parseTimestamp(data.createdAt),
              updatedAt: parseTimestamp(data.updatedAt),
            });
          });

          // Migrate initial local notes to user cloud on first login
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
                isPublic: false,
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
          console.error('Firestore private notes sync error:', err);
          setSyncError('Ошибка доступа к приватной облачной базе');
          setIsSyncing(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Failed to subscribe to private notes:', err);
      setIsSyncing(false);
    }
  }, [currentUser]);

  // Google Sign-in
  const signInWithGoogle = async () => {
    try {
      setSyncError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error('Sign in error details:', error);

      if (error?.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        setSyncError(`Домен ${domain} не добавлен в список разрешенных в Firebase Auth.`);
        return;
      }

      if (error?.code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch {
          setSyncError('Всплывающее окно заблокировано браузером.');
          return;
        }
      }

      if (error?.code === 'auth/popup-closed-by-user') {
        return;
      }

      if (error?.code === 'auth/operation-not-allowed') {
        setSyncError('Вход через Google не включен в консоли Firebase (Authentication -> Sign-in method).');
        return;
      }

      setSyncError(error?.message ? `Ошибка входа: ${error.code || error.message}` : 'Не удалось войти через Google.');
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setCloudNotes(null);
      setSyncError(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Save public or private note
  const saveNote = async (note: Note) => {
    if (note.isPublic) {
      try {
        const docRef = doc(db, 'public_notes', note.id);
        await setDoc(docRef, {
          title: note.title,
          content: note.content,
          category: note.category,
          isPinned: note.isPinned,
          isPublic: true,
          authorName: note.authorName || 'Гость',
          authorId: currentUser?.uid || 'guest',
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          savedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('Failed to save public note:', err);
      }
    } else if (currentUser) {
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'notes', note.id);
        await setDoc(docRef, {
          userId: currentUser.uid,
          title: note.title,
          content: note.content,
          category: note.category,
          isPinned: note.isPinned,
          isPublic: false,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          syncedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('Failed to save private cloud note:', err);
      }
    }
  };

  // Delete note (from public_notes or private notes)
  const deleteNote = async (noteId: string, isPublic?: boolean) => {
    try {
      if (isPublic) {
        const docRef = doc(db, 'public_notes', noteId);
        await deleteDoc(docRef);
      } else if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid, 'notes', noteId);
        await deleteDoc(docRef);
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  return {
    currentUser,
    isAuthLoading,
    cloudNotes,
    publicNotes,
    isPublicLoading,
    isSyncing,
    syncError,
    setSyncError,
    signInWithGoogle,
    signOut,
    saveNote,
    deleteNote,
  };
}
