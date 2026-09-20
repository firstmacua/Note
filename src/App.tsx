/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  X, 
  Plus, 
  Pin, 
  FileText, 
  Inbox, 
  Check, 
  Globe, 
  Lock,
  Users
} from 'lucide-react';
import { Note, NoteCategory, CategoryFilter, NotesTab, WorkoutExercise } from './types';
import { CATEGORIES, INITIAL_NOTES } from './data';
import { NoteEditor } from './components/NoteEditor';
import { NoteCard } from './components/NoteCard';
import { ShareModal } from './components/ShareModal';
import { CloudSyncBar } from './components/CloudSyncBar';
import { CloudErrorBanner } from './components/CloudErrorBanner';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { useCloudNotes } from './hooks/useCloudNotes';
import { Language, translations } from './translations';

const STORAGE_KEY = 'quick_notes_storage_v1';
const LANG_STORAGE_KEY = 'mikenote_language';

export default function App() {
  // Language state: defaults to Ukrainian ('uk') as requested, switchable to English ('en')
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === 'en' || saved === 'uk') return saved;
    } catch {
      // fallback
    }
    return 'uk';
  });

  const handleLanguageChange = (lang: Language) => {
    setCurrentLang(lang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // fallback
    }
  };

  const t = translations[currentLang];

  const [localNotes, setLocalNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback
    }
    return INITIAL_NOTES;
  });

  // Active tab: 'public' (Shared guest wall - visible to all) or 'my' (My private notes)
  const [activeTab, setActiveTab] = useState<NotesTab>('public');

  // Cloud hook handles both PUBLIC guest wall and PRIVATE user notes
  const {
    currentUser,
    isAuthLoading,
    cloudNotes,
    publicNotes,
    isSyncing,
    syncError,
    setSyncError,
    signInWithGoogle,
    signOut,
    saveNote,
    deleteNote,
  } = useCloudNotes(localNotes);

  // Private notes list (from cloud when logged in, or local fallback)
  const myNotes = useMemo(() => {
    return Array.isArray(cloudNotes) ? cloudNotes : (Array.isArray(localNotes) ? localNotes : []);
  }, [cloudNotes, localNotes]);

  // Selected notes depending on tab, guaranteed to be a valid array
  const currentNotesList = useMemo(() => {
    const list = activeTab === 'public' ? publicNotes : myNotes;
    return Array.isArray(list) ? list : [];
  }, [activeTab, publicNotes, myNotes]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
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
            title: parsed.t || (currentLang === 'uk' ? 'Нотатка від друга' : 'Note from friend'),
            content: parsed.c || '',
            category: (parsed.cat as NoteCategory) || 'Загальне',
          });
        }
      }
    } catch {
      // Invalid link payload, ignore safely
    }
  }, [currentLang]);

  const handleAcceptReceivedNote = () => {
    if (!receivedNote) return;
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: receivedNote.title,
      content: receivedNote.content,
      category: receivedNote.category,
      isPinned: true,
      isPublic: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setLocalNotes((prev) => [newNote, ...prev]);
    saveNote(newNote);
    setActiveTab('my');
    setReceivedAccepted(true);
    setTimeout(() => {
      setReceivedNote(null);
      setReceivedAccepted(false);
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

  // Create note
  const handleCreateNote = (data: {
    title: string;
    content: string;
    category: NoteCategory;
    isPinned: boolean;
    isPublic: boolean;
    authorName: string;
    exercises?: WorkoutExercise[];
  }) => {
    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: data.title,
      content: data.content,
      category: data.category,
      isPinned: data.isPinned,
      isPublic: data.isPublic,
      authorName: data.authorName,
      exercises: data.exercises,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (data.isPublic) {
      saveNote(newNote);
      setActiveTab('public');
    } else {
      setLocalNotes((prev) => [newNote, ...prev]);
      saveNote(newNote);
      setActiveTab('my');
    }

    setIsEditorExpanded(false);
  };

  // Update note
  const handleUpdateNote = (data: {
    title: string;
    content: string;
    category: NoteCategory;
    isPinned: boolean;
    isPublic: boolean;
    authorName: string;
    exercises?: WorkoutExercise[];
  }) => {
    if (!editingNote) return;

    const updated: Note = {
      ...editingNote,
      title: data.title,
      content: data.content,
      category: data.category,
      isPinned: data.isPinned,
      isPublic: data.isPublic,
      authorName: data.authorName,
      exercises: data.exercises,
      updatedAt: Date.now(),
    };

    if (editingNote.isPublic) {
      saveNote(updated);
    } else {
      setLocalNotes((prev) => prev.map((n) => (n.id === editingNote.id ? updated : n)));
      saveNote(updated);
    }

    setEditingNote(null);
  };

  const handleTogglePin = (id: string) => {
    const target = currentNotesList.find((n) => n.id === id);
    if (!target) return;
    const updated: Note = { ...target, isPinned: !target.isPinned, updatedAt: Date.now() };

    if (target.isPublic) {
      saveNote(updated);
    } else {
      setLocalNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      saveNote(updated);
    }
  };

  const handleDeleteNote = (id: string) => {
    const target = currentNotesList.find((n) => n.id === id);
    const isPublic = target ? target.isPublic : activeTab === 'public';

    if (isPublic) {
      deleteNote(id, true);
    } else {
      setLocalNotes((prev) => prev.filter((n) => n.id !== id));
      deleteNote(id, false);
    }

    if (editingNote?.id === id) {
      setEditingNote(null);
    }
  };

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return currentNotesList
      .filter((note) => {
        if (!note) return false;
        const matchesCategory =
          activeCategory === 'all' ||
          note.category === activeCategory ||
          (activeCategory === 'Загальне' && (note.category === 'Общее' || note.category === 'General')) ||
          (activeCategory === 'Робота' && (note.category === 'Работа' || note.category === 'Work')) ||
          (activeCategory === 'Ідеї' && (note.category === 'Идеи' || note.category === 'Ideas')) ||
          (activeCategory === 'Покупки' && (note.category === 'Shopping')) ||
          (activeCategory === 'Тренування' && (note.category === 'Тренировка' || note.category === 'Workout')) ||
          (activeCategory === 'Тренировка' && (note.category === 'Тренування' || note.category === 'Workout'));

        const matchesQuery =
          !query ||
          (note.title && note.title.toLowerCase().includes(query)) ||
          (note.content && note.content.toLowerCase().includes(query)) ||
          (note.authorName && note.authorName.toLowerCase().includes(query));
        return matchesCategory && matchesQuery;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const dateA = Number(a.updatedAt || a.createdAt || 0);
        const dateB = Number(b.updatedAt || b.createdAt || 0);
        return dateB - dateA;
      });
  }, [currentNotesList, searchQuery, activeCategory]);

  const pinnedCount = useMemo(() => {
    return currentNotesList.filter((n) => n && n.isPinned).length;
  }, [currentNotesList]);

  return (
    <div id="notes-app-root" className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
      {/* Header */}
      <header
        id="app-header"
        className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-neutral-200 py-3.5 px-4 sm:px-6"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2.5">
            <div
              id="app-logo-badge"
              className="w-9 h-9 rounded-lg overflow-hidden border border-neutral-200 shadow-xs shrink-0 flex items-center justify-center bg-neutral-100"
            >
              <img
                src="/cat_logo.jpg"
                alt="MikeNote Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 id="app-heading" className="text-lg font-bold tracking-tight text-neutral-900 flex items-center gap-2">
                MikeNote
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 hidden sm:inline-flex items-center gap-1">
                  <Users className="w-3 h-3" /> {t.publicWallBadge}
                </span>
              </h1>
              <p id="app-subheading" className="text-xs text-neutral-500">
                {t.notesCount(currentNotesList.length)}
                {pinnedCount > 0 && ` • ${t.pinnedCount(pinnedCount)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">
            {/* Language Switcher: Ukrainian (default) & English */}
            <LanguageSwitcher
              currentLang={currentLang}
              onLanguageChange={handleLanguageChange}
            />

            <CloudSyncBar
              currentUser={currentUser}
              isAuthLoading={isAuthLoading}
              isSyncing={isSyncing}
              syncError={syncError}
              t={t}
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
              <span className="hidden sm:inline">{t.newNoteBtn}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error banner for cloud sync diagnostics */}
        <CloudErrorBanner error={syncError} onDismiss={() => setSyncError(null)} />

        {/* Tab Navigation: Public notes vs My private notes */}
        <section id="tabs-navigation" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
          <div className="flex items-center gap-2 bg-neutral-200/70 p-1 rounded-xl">
            <button
              id="tab-public-notes"
              type="button"
              onClick={() => setActiveTab('public')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'public'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.tabPublic}</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                {publicNotes.length}
              </span>
            </button>

            <button
              id="tab-my-notes"
              type="button"
              onClick={() => setActiveTab('my')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'my'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-neutral-500" />
              <span>{t.tabMy}</span>
              <span className="text-[10px] bg-neutral-200 text-neutral-700 font-bold px-1.5 py-0.5 rounded-full">
                {myNotes.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-neutral-500">
            {activeTab === 'public'
              ? t.tabPublicDesc
              : currentUser
              ? t.tabMySyncedDesc
              : t.tabMyLocalDesc}
          </div>
        </section>

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
                  <span className="text-xs font-semibold text-blue-900">{t.receivedBannerTitle}</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">
                    {(t.categories as Record<string, string>)[receivedNote.category] || receivedNote.category}
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
                {t.receivedBannerClose}
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
                    {t.receivedBannerSaved}
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    {t.receivedBannerSave}
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
                {editingNote
                  ? t.editNoteTitle
                  : activeTab === 'public'
                  ? t.newPublicNoteTitle
                  : t.newMyNoteTitle}
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
                {t.hideEditor}
              </button>
            </div>
            <NoteEditor
              initialNote={editingNote}
              defaultIsPublic={activeTab === 'public'}
              t={t}
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
              placeholder={activeTab === 'public' ? t.searchPlaceholderPublic : t.searchPlaceholderMy}
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
            <button
              id="filter-pill-all"
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {t.allCategories}
            </button>
            {CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat;
              const translated = (t.categories as Record<string, string>)[cat] || cat;
              return (
                <button
                  key={cat}
                  id={`filter-pill-${cat}`}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap inline-flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <span>{translated}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Indicator */}
        {filteredNotes.length > 0 && (
          <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
            <span>
              {t.shownNotes(filteredNotes.length, activeTab === 'public')}
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-neutral-600 hover:underline"
              >
                {t.resetSearch}
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
                t={t}
                currentLang={currentLang}
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
              {activeTab === 'public' ? <Globe className="w-6 h-6 text-emerald-600" /> : <FileText className="w-6 h-6" />}
            </div>
            <h3 id="empty-state-title" className="text-base font-semibold text-neutral-900 mb-1">
              {searchQuery
                ? t.emptySearchTitle
                : activeTab === 'public'
                ? t.emptyPublicTitle
                : t.emptyMyTitle}
            </h3>
            <p id="empty-state-desc" className="text-xs text-neutral-500 mb-5 leading-relaxed">
              {searchQuery
                ? t.emptySearchDesc(searchQuery)
                : activeTab === 'public'
                ? t.emptyPublicDesc
                : t.emptyMyDesc}
            </p>
            {searchQuery ? (
              <button
                id="reset-filter-btn"
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                {t.resetFilters}
              </button>
            ) : (
              <button
                id="empty-create-btn"
                type="button"
                onClick={() => setIsEditorExpanded(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors shadow-xs whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                {activeTab === 'public' ? t.writeForEveryone : t.createFirstNote}
              </button>
            )}
          </div>
        )}
      </main>

      {/* Modal for Sharing Note with a Friend */}
      <ShareModal
        note={sharingNote}
        isOpen={!!sharingNote}
        t={t}
        currentLang={currentLang}
        onClose={() => setSharingNote(null)}
      />
    </div>
  );
}
