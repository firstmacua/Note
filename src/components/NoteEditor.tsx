import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Pin, Globe, Lock, Trash2, Dumbbell } from 'lucide-react';
import { Note, NoteCategory, WorkoutExercise } from '../types';
import { CATEGORIES } from '../data';
import { Translations } from '../translations';

interface NoteEditorProps {
  initialNote?: Note | null;
  defaultIsPublic?: boolean;
  t: Translations;
  onSave: (noteData: {
    title: string;
    content: string;
    category: NoteCategory;
    isPinned: boolean;
    isPublic: boolean;
    authorName: string;
    exercises?: WorkoutExercise[];
  }) => void;
  onCancel?: () => void;
}

const createEmptyExercise = (): WorkoutExercise => ({
  id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  name: '',
  sets: '',
  reps: '',
});

function parseExercisesFromText(content: string): { exercises: WorkoutExercise[]; notes: string } {
  if (!content) return { exercises: [], notes: '' };
  const lines = content.split('\n');
  const foundExercises: WorkoutExercise[] = [];
  const noteLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(
      /^(?:\d+[\.\)]\s*)?(.+?)(?:\s*[-—:]\s*(\d+)\s*(?:підх\.?|подх\.?|sets?)?\s*[×x*]\s*(\d+(?:-\d+)?)\s*(?:повт\.?|повтор\.?|reps?)?)?$/i
    );
    if (match && (match[2] || match[3])) {
      foundExercises.push({
        id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: match[1].trim(),
        sets: match[2] || '',
        reps: match[3] || '',
      });
    } else {
      noteLines.push(trimmed);
    }
  }

  return { exercises: foundExercises, notes: noteLines.join('\n') };
}

function extractExtraNotes(content: string, exercises: WorkoutExercise[]): string {
  if (!content) return '';
  const lines = content.split('\n');
  const remaining = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    return !exercises.some((ex) => ex.name && trimmed.includes(ex.name));
  });
  return remaining.join('\n').trim();
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  initialNote,
  defaultIsPublic = false,
  t,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoteCategory>('Загальне');
  const [isPinned, setIsPinned] = useState(false);
  const [isPublic, setIsPublic] = useState(defaultIsPublic);
  const [authorName, setAuthorName] = useState(() => {
    return localStorage.getItem('guest_author_name') || '';
  });
  const [exercises, setExercises] = useState<WorkoutExercise[]>([createEmptyExercise()]);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [error, setError] = useState('');

  const isWorkoutCategory =
    category === 'Тренування' || category === 'Тренировка' || category === 'Workout';

  useEffect(() => {
    if (initialNote) {
      setTitle(initialNote.title);
      setContent(initialNote.content);
      const cat = (initialNote.category as NoteCategory) || 'Загальне';
      setCategory(cat);
      setIsPinned(initialNote.isPinned);
      setIsPublic(Boolean(initialNote.isPublic));
      setAuthorName(initialNote.authorName || '');

      const isWorkout =
        cat === 'Тренування' || cat === 'Тренировка' || cat === 'Workout';

      if (initialNote.exercises && initialNote.exercises.length > 0) {
        setExercises(initialNote.exercises);
        setWorkoutNotes(extractExtraNotes(initialNote.content, initialNote.exercises));
      } else if (isWorkout) {
        const parsed = parseExercisesFromText(initialNote.content);
        setExercises(parsed.exercises.length > 0 ? parsed.exercises : [createEmptyExercise()]);
        setWorkoutNotes(parsed.notes);
      } else {
        setExercises([createEmptyExercise()]);
        setWorkoutNotes('');
      }
      setError('');
    } else {
      setTitle('');
      setContent('');
      setCategory('Загальне');
      setIsPinned(false);
      setIsPublic(defaultIsPublic);
      setExercises([createEmptyExercise()]);
      setWorkoutNotes('');
      setError('');
    }
  }, [initialNote, defaultIsPublic]);

  const handleAddExercise = () => {
    setExercises((prev) => [...prev, createEmptyExercise()]);
  };

  const handleRemoveExercise = (id: string) => {
    setExercises((prev) => (prev.length > 1 ? prev.filter((ex) => ex.id !== id) : prev));
  };

  const handleUpdateExercise = (
    id: string,
    field: 'name' | 'sets' | 'reps',
    value: string
  ) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, [field]: value } : ex))
    );
    if (error) setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalContent = content.trim();
    let finalExercises: WorkoutExercise[] | undefined = undefined;

    if (isWorkoutCategory) {
      const validExercises = exercises.filter(
        (ex) => ex.name.trim() || ex.sets.trim() || ex.reps.trim()
      );

      if (validExercises.length > 0) {
        finalExercises = validExercises;
        const formatted = validExercises
          .map((ex, idx) => {
            const parts: string[] = [];
            if (ex.sets.trim()) parts.push(`${ex.sets.trim()} ${t.setsShort}`);
            if (ex.reps.trim()) parts.push(`${ex.reps.trim()} ${t.repsShort}`);
            const detail = parts.length > 0 ? ` — ${parts.join(' × ')}` : '';
            return `${idx + 1}. ${ex.name.trim() || 'Вправа'}${detail}`;
          })
          .join('\n');

        finalContent = workoutNotes.trim()
          ? `${formatted}\n\n${workoutNotes.trim()}`
          : formatted;
      } else if (workoutNotes.trim()) {
        finalContent = workoutNotes.trim();
      }
    }

    if (!finalContent && !title.trim()) {
      setError(t.editorErrorRequired);
      return;
    }

    const trimmedAuthor = authorName.trim();
    if (trimmedAuthor) {
      localStorage.setItem('guest_author_name', trimmedAuthor);
    }

    onSave({
      title:
        title.trim() ||
        (t.appName === 'MikeNote'
          ? t.allCategories === 'Всі'
            ? 'Без назви'
            : 'Untitled'
          : 'Untitled'),
      content: finalContent,
      category,
      isPinned,
      isPublic,
      authorName: trimmedAuthor || t.cardGuest,
      exercises: finalExercises,
    });

    if (!initialNote) {
      setTitle('');
      setContent('');
      setIsPinned(false);
      setExercises([createEmptyExercise()]);
      setWorkoutNotes('');
      setError('');
    }
  };

  return (
    <form
      id="note-editor-form"
      onSubmit={handleSubmit}
      className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm transition-all focus-within:border-neutral-400"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <input
          id="note-title-input"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError('');
          }}
          placeholder={t.editorTitlePlaceholder}
          className="w-full text-base font-medium text-neutral-900 placeholder:text-neutral-400 bg-transparent border-none outline-none"
        />
        <button
          id="note-pin-toggle-btn"
          type="button"
          onClick={() => setIsPinned(!isPinned)}
          title={isPinned ? t.cardUnpin : t.editorPinLabel}
          className={`p-2 rounded-lg transition-colors shrink-0 flex items-center justify-center ${
            isPinned
              ? 'bg-amber-50 text-amber-600'
              : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
          }`}
        >
          <Pin className={`w-4 h-4 ${isPinned ? 'fill-amber-600' : ''}`} />
        </button>
      </div>

      {/* Workout mode: Exercise Name (yellow box) + Sets & Reps columns */}
      {isWorkoutCategory ? (
        <div id="workout-editor-section" className="mb-4">
          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-neutral-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
              <Dumbbell className="w-4 h-4 text-orange-600" />
              <span>{t.workoutSectionTitle}</span>
            </div>
            <span className="text-[11px] text-neutral-400">
              {exercises.length} {exercises.length === 1 ? 'вправа' : 'вправ'}
            </span>
          </div>

          {/* Column labels for desktop view */}
          <div className="hidden sm:flex items-center gap-2 mb-1 text-[11px] font-medium text-neutral-500 px-1">
            <span className="flex-1 text-amber-700 font-semibold">
              {t.exerciseNamePlaceholder.replace(/\s*\(.*?\)/, '')}
            </span>
            <span className="w-24 text-center text-neutral-800 font-semibold">
              {t.exerciseSetsLabel}
            </span>
            <span className="w-28 text-center text-neutral-800 font-semibold">
              {t.exerciseRepsLabel}
            </span>
            {exercises.length > 1 && <span className="w-8" />}
          </div>

          {/* Exercise items list */}
          <div className="space-y-2">
            {exercises.map((ex, index) => (
              <div
                key={ex.id}
                id={`exercise-row-${index}`}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-neutral-50/50 p-2 sm:p-0 rounded-lg border border-neutral-100 sm:border-transparent"
              >
                {/* Yellow input box as drawn in user screenshot */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    id={`exercise-name-${index}`}
                    value={ex.name}
                    onChange={(e) => handleUpdateExercise(ex.id, 'name', e.target.value)}
                    placeholder={t.exerciseNamePlaceholder}
                    className="w-full text-sm font-medium text-neutral-900 placeholder:text-neutral-400 bg-amber-50/40 border border-amber-300 hover:border-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-200 rounded-lg px-3 py-2 outline-none transition-all shadow-2xs"
                  />
                </div>

                {/* Black box 1: Sets (Підходи) */}
                <div className="w-full sm:w-24 shrink-0 flex items-center gap-1">
                  <span className="sm:hidden text-xs text-neutral-500 w-20">
                    {t.exerciseSetsLabel}:
                  </span>
                  <input
                    type="text"
                    id={`exercise-sets-${index}`}
                    value={ex.sets}
                    onChange={(e) => handleUpdateExercise(ex.id, 'sets', e.target.value)}
                    placeholder={t.exerciseSetsPlaceholder}
                    className="w-full text-sm text-neutral-900 placeholder:text-neutral-400 bg-white border border-neutral-300 hover:border-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-200 rounded-lg px-2.5 py-2 text-center outline-none transition-all font-mono"
                  />
                </div>

                {/* Black box 2: Reps (Повторення) */}
                <div className="w-full sm:w-28 shrink-0 flex items-center gap-1">
                  <span className="sm:hidden text-xs text-neutral-500 w-20">
                    {t.exerciseRepsLabel}:
                  </span>
                  <input
                    type="text"
                    id={`exercise-reps-${index}`}
                    value={ex.reps}
                    onChange={(e) => handleUpdateExercise(ex.id, 'reps', e.target.value)}
                    placeholder={t.exerciseRepsPlaceholder}
                    className="w-full text-sm text-neutral-900 placeholder:text-neutral-400 bg-white border border-neutral-300 hover:border-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-200 rounded-lg px-2.5 py-2 text-center outline-none transition-all font-mono"
                  />
                </div>

                {/* Delete exercise button */}
                {exercises.length > 1 && (
                  <button
                    type="button"
                    id={`remove-exercise-${index}`}
                    onClick={() => handleRemoveExercise(ex.id)}
                    title={t.removeExerciseBtn}
                    className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 flex items-center justify-center self-end sm:self-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add exercise row button */}
          <button
            type="button"
            id="add-exercise-btn"
            onClick={handleAddExercise}
            className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/90 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            {t.addExerciseBtn}
          </button>

          {/* Optional notes / comments */}
          <textarea
            id="workout-notes-input"
            value={workoutNotes}
            onChange={(e) => setWorkoutNotes(e.target.value)}
            rows={2}
            placeholder={t.workoutNotesPlaceholder}
            className="mt-3 w-full text-xs text-neutral-700 placeholder:text-neutral-400 bg-neutral-50/70 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-neutral-400 resize-y"
          />
        </div>
      ) : (
        <>
          <textarea
            id="note-content-input"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (error) setError('');
            }}
            rows={initialNote ? 5 : 3}
            placeholder={t.editorContentPlaceholder}
            className="w-full text-sm text-neutral-800 placeholder:text-neutral-400 bg-transparent border-none outline-none resize-y min-h-[72px]"
          />
        </>
      )}

      {error && (
        <p id="note-editor-error" className="text-xs text-rose-600 mb-3">
          {error}
        </p>
      )}

      {/* Guest author name field & Public/Private toggle */}
      <div className="py-2.5 px-3 mb-3 rounded-lg bg-neutral-50 border border-neutral-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            id="editor-visibility-toggle"
            onClick={() => setIsPublic(!isPublic)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium transition-colors ${
              isPublic
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-neutral-200 text-neutral-700'
            }`}
          >
            {isPublic ? (
              <>
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.editorPublicLabel}</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-neutral-500" />
                <span>{t.tabMy}</span>
              </>
            )}
          </button>
        </div>

        {isPublic && (
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-neutral-500 whitespace-nowrap">{t.editorAuthorLabel}:</span>
            <input
              type="text"
              id="guest-author-input"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder={t.editorAuthorPlaceholder}
              maxLength={30}
              className="bg-white px-2 py-1 rounded border border-neutral-300 text-xs text-neutral-900 outline-none focus:border-neutral-600 w-28 sm:w-36"
            />
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
        {/* Category selector */}
        <div id="note-category-picker" className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat;
            const translatedCat = (t.categories as Record<string, string>)[cat] || cat;
            return (
              <button
                key={cat}
                id={`category-btn-${cat}`}
                type="button"
                onClick={() => setCategory(cat)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                  isSelected
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {translatedCat}
              </button>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 ml-auto">
          {onCancel && (
            <button
              id="note-cancel-btn"
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" />
              {t.editorCancelBtn}
            </button>
          )}

          <button
            id="note-save-btn"
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors shadow-xs whitespace-nowrap"
          >
            {initialNote ? (
              <>
                <Check className="w-3.5 h-3.5" />
                {t.editorUpdateBtn}
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                {isPublic ? t.writeForEveryone : t.editorSaveBtn}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
