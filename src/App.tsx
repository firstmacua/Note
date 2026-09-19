/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { Search, StickyNote, X, Plus, Pin, FileText, Share2, Inbox, Check } from 'lucide-react';
import { Note, NoteCategory, CategoryFilter } from './types';
import { CATEGORIES, INITIAL_NOTES } from './data';
import { NoteEditor } from './components/NoteEditor';
import { NoteCard } from './components/NoteCard';
import { ShareModal } from './components/ShareModal';
import { CloudSyncBar } from './components/CloudSyncBar';
import { useCloudNotes } from './hooks/useCloudNotes';

const STORAGE_KEY = 'quick_notes_storage_v1';

export default function App() {
  const [localNotes, setLocalNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return INITIAL_NOTES;
  });

  // Cloud sync hook with Firebase Realtime Firestore & Google Auth
  const {
    currentUser,
    isAuthLoading,
    cloudNotes,
    isSyncing,
    syncError,
    signInWithGoogle,
    signOut,
    saveCloudNote,
    deleteCloudNote,
  } = useCloudNotes(localNotes);

  // Active notes are from cloud if logged in, otherwise local
  const notes = cloudNotes !== null ? cloudNotes : localNotes;

  const setNotes = (updater: Note[] | ((prev: Note[]) => Note[])) => {
    if (typeof updater === 'function') {
      setLocalNotes((prev) => updater(prev));
    } else {
      setLocalNotes(updater);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('Все');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [sharingNote, setSharingNote] = useState<Note | null>(null);
  const [receivedNote, setReceivedNote] = useState<{
    title: string;
    content: string;
    category: NoteCategory;
  } | null>(null);
  const [receivedAccepted, setReceivedAccepted] = useState(false);

  // Parse incoming note shared from friend via URL
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sharedB64 = params.get('shared');
      if (sharedB64) {
        const jsonStr = decodeURIComponent(
          atob(sharedB64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const parsed = JSON.parse(jsonStr);
        if (parsed && (parsed.t || parsed.c)) {
          setReceivedNote({
            title: parsed.t || 'Заметка от друга',
            content: parsed.c || '',
            category: (parsed.cat as NoteCategory) || 'Общее',
          });
        }
      }
    } catch {
      // Invalid link payload, ignore safely
    }
  }, []);

  const handleAcceptReceivedNote = () => {
    if (!receivedNote) return;
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: receivedNote.title,
      content: receivedNote.content,
      category: receivedNote.category,
      isPinned: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setReceivedAccepted(true);
    setTimeout(() => {
      setReceivedNote(null);
      setReceivedAccepted(false);
      // Clean query parameter without page reload
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('shared');
        window.history.replaceState({}, '', url.toString());
      } catch {
        // Safe fallback
      }
    }, 1500);
  };

  const handleDismissReceivedNote = () => {
    setReceivedNote(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('shared');
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Safe fallback
    }
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {
      // Ignore storage errors
    }
  }, [notes]);

  const handleCreateNote = (data: {
    title: string;
    content: string;
    category: NoteCategory;
    isPinned: boolean;
  }) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: data.title,
      content: data.content,
      category: data.category,
      isPinned: data.isPinned,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes((prev) => [newNote, ...prev]);
    saveCloudNote(newNote);
    setIsEditorExpanded(false);
  };

  const handleUpdateNote = (data: {
    title: string;
    content: string;
    category: NoteCategory;
    isPinned: boolean;
  }) => {
    if (!editingNote) return;
    const updated: Note = {
      ...editingNote,
      title: data.title,
      content: data.content,
      category: data.category,
      isPinned: data.isPinned,
      updatedAt: Date.now(),
    };
    setNotes((prev) => prev.map((n) => (n.id === editingNote.id ? updated : n)));
    saveCloudNote(updated);
    setEditingNote(null);
  };

  const handleTogglePin = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    const updated: Note = { ...target, isPinned: !target.isPinned, updatedAt: Date.now() };
    setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    saveCloudNote(updated);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    deleteCloudNote(id);
    if (editingNote?.id === id) {
      setEditingNote(null);
    }
  };

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return notes
      .filter((note) => {
        const matchesCategory =
          activeCategory === 'Все' || note.category === activeCategory;
        const matchesQuery =
          !query ||
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query);
        return matchesCategory && matchesQuery;
      })
      .sort((a, b) => {
        // Pinned notes first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // Then by updated/created date descending
        return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
      });
  }, [notes, searchQuery, activeCategory]);

  const pinnedCount = useMemo(() => notes.filter((n) => n.isPinned).length, [notes]);

  return (
    <div id="notes-app-root" className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
      {/* Header */}
      <header
        id="app-header"
        className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-neutral-200 py-3.5 px-4 sm:px-6"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div
              id="app-logo-badge"
              className="w-9 h-9 rounded-lg bg-neutral-900 text-white flex items-center justify-center shadow-xs"
            >
              <StickyNote className="w-5 h-5" />
            </div>
            <div>
              <h1 id="app-heading" className="text-lg font-bold tracking-tight text-neutral-900">
                Заметки
              </h1>
              <p id="app-subheading" className="text-xs text-neutral-500">
                {notes.length} {notes.length === 1 ? 'заметка' : notes.length > 4 ? 'заметок' : 'заметки'}
                {pinnedCount > 0 && ` • ${pinnedCount} закреплено`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CloudSyncBar
              currentUser={currentUser}
              isAuthLoading={isAuthLoading}
              isSyncing={isSyncing}
              syncError={syncError}
              onSignIn={signInWithGoogle}
              onSignOut={signOut}
            />

            <button
              id="open-editor-btn"
              type="button"
              onClick={() => {
                setEditingNote(null);
                setIsEditorExpanded(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors shadow-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Новая заметка</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Banner when a note was received from a friend via link */}
        {receivedNote && (
          <section
            id="received-note-banner"
            className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5 sm:mt-0">
                <Inbox className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-blue-900">Вам отправлена заметка</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">
                    {receivedNote.category}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-neutral-900 truncate mt-0.5">
                  {receivedNote.title}
                </h4>
                {receivedNote.content && (
                  <p className="text-xs text-neutral-600 line-clamp-2 mt-0.5">
                    {receivedNote.content}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-blue-100">
              <button
                id="dismiss-received-btn"
                type="button"
                onClick={handleDismissReceivedNote}
                className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-blue-100/60 rounded-lg transition-colors"
              >
                Закрыть
              </button>
              <button
                id="accept-received-btn"
                type="button"
                onClick={handleAcceptReceivedNote}
                disabled={receivedAccepted}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
              >
                {receivedAccepted ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Сохранено!
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Сохранить в заметки
                  </>
                )}
              </button>
            </div>
          </section>
        )}

        {/* Note Editor Area (Create or Edit) */}
        {(isEditorExpanded || editingNote) && (
          <section id="editor-section" className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 id="editor-section-title" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                {editingNote ? 'Редактирование заметки' : 'Новая заметка'}
              </h2>
              <button
                id="close-editor-btn"
                type="button"
                onClick={() => {
                  setIsEditorExpanded(false);
                  setEditingNote(null);
                }}
                className="text-neutral-400 hover:text-neutral-700 text-xs flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Скрыть
              </button>
            </div>
            <NoteEditor
              initialNote={editingNote}
              onSave={editingNote ? handleUpdateNote : handleCreateNote}
              onCancel={() => {
                setIsEditorExpanded(false);
                setEditingNote(null);
              }}
            />
          </section>
        )}

        {/* Search & Category Filter Toolbar */}
        <section
          id="toolbar-section"
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
        >
          {/* Search bar */}
          <div
            id="search-container"
            className="relative flex-1 max-w-md bg-white border border-neutral-200 rounded-lg px-3 py-2 flex items-center gap-2 focus-within:border-neutral-400 transition-colors shadow-xs"
          >
            <Search className="w-4 h-4 text-neutral-400 shrink-0" />
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по заметкам..."
              className="w-full text-xs text-neutral-900 placeholder:text-neutral-400 bg-transparent border-none outline-none"
            />
            {searchQuery && (
              <button
                id="clear-search-btn"
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-neutral-400 hover:text-neutral-700 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Categories Filter */}
          <div id="categories-filter" className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['Все', ...CATEGORIES] as CategoryFilter[]).map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <button
                  key={cat}
                  id={`filter-pill-${cat}`}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </section>

        {/* Pinned section indicator if applicable */}
        {filteredNotes.length > 0 && (
          <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
            <span>
              Показано: {filteredNotes.length}{' '}
              {filteredNotes.length === 1
                ? 'заметка'
                : filteredNotes.length > 4
                ? 'заметок'
                : 'заметки'}
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-neutral-600 hover:underline"
              >
                Сбросить поиск
              </button>
            )}
          </div>
        )}

        {/* Notes Grid */}
        {filteredNotes.length > 0 ? (
          <section
            id="notes-grid"
            className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr"
          >
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onTogglePin={handleTogglePin}
                onEdit={(n) => {
                  setEditingNote(n);
                  setIsEditorExpanded(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onDelete={handleDeleteNote}
                onShare={(n) => setSharingNote(n)}
              />
            ))}
          </section>
        ) : (
          /* Empty State */
          <div
            id="empty-state"
            className="bg-white border border-neutral-200 rounded-xl p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto"
          >
            <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 id="empty-state-title" className="text-base font-semibold text-neutral-900 mb-1">
              {searchQuery ? 'Заметки не найдены' : 'Список заметок пуст'}
            </h3>
            <p id="empty-state-desc" className="text-xs text-neutral-500 mb-5 leading-relaxed">
              {searchQuery
                ? `По запросу «${searchQuery}» ничего не найдено. Попробуйте изменить формулировку.`
                : 'Создайте свою первую запись, нажав на кнопку ниже.'}
            </p>
            {searchQuery ? (
              <button
                id="reset-filter-btn"
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('Все');
                }}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                Сбросить фильтры
              </button>
            ) : (
              <button
                id="empty-create-btn"
                type="button"
                onClick={() => setIsEditorExpanded(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Создать первую заметку
              </button>
            )}
          </div>
        )}
      </main>

      {/* Modal for Sharing Note with a Friend */}
      <ShareModal
        note={sharingNote}
        isOpen={!!sharingNote}
        onClose={() => setSharingNote(null)}
      />
    </div>
  );
}
