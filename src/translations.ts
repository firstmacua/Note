export type Language = 'uk' | 'en';

export interface Translations {
  appName: string;
  publicWallBadge: string;
  notesCount: (count: number) => string;
  pinnedCount: (count: number) => string;
  newNoteBtn: string;
  cloudChecking: string;
  cloudSyncing: string;
  cloudActive: string;
  cloudSignIn: string;
  cloudSignOut: string;
  cloudSignInHint: string;
  tabPublic: string;
  tabMy: string;
  tabPublicDesc: string;
  tabMySyncedDesc: string;
  tabMyLocalDesc: string;
  allCategories: string;
  searchPlaceholderPublic: string;
  searchPlaceholderMy: string;
  shownNotes: (count: number, isPublic: boolean) => string;
  resetSearch: string;
  resetFilters: string;
  emptySearchTitle: string;
  emptySearchDesc: (q: string) => string;
  emptyPublicTitle: string;
  emptyPublicDesc: string;
  emptyMyTitle: string;
  emptyMyDesc: string;
  writeForEveryone: string;
  createFirstNote: string;
  editNoteTitle: string;
  newPublicNoteTitle: string;
  newMyNoteTitle: string;
  hideEditor: string;
  receivedBannerTitle: string;
  receivedBannerClose: string;
  receivedBannerSave: string;
  receivedBannerSaved: string;
  // Editor
  editorTitlePlaceholder: string;
  editorContentPlaceholder: string;
  editorAuthorPlaceholder: string;
  editorAuthorLabel: string;
  editorCategoryLabel: string;
  editorPinLabel: string;
  editorPublicLabel: string;
  editorPublicHelp: string;
  editorPrivateHelp: string;
  editorSaveBtn: string;
  editorUpdateBtn: string;
  editorCancelBtn: string;
  editorErrorRequired: string;
  // Workout-specific translations
  exerciseNamePlaceholder: string;
  exerciseSetsLabel: string;
  exerciseRepsLabel: string;
  exerciseSetsPlaceholder: string;
  exerciseRepsPlaceholder: string;
  addExerciseBtn: string;
  removeExerciseBtn: string;
  workoutSectionTitle: string;
  workoutNotesPlaceholder: string;
  setsShort: string;
  repsShort: string;
  // Card
  cardJustNow: string;
  cardGuest: string;
  cardPublicBadge: string;
  cardCopy: string;
  cardCopied: string;
  cardPin: string;
  cardUnpin: string;
  cardEdit: string;
  cardDelete: string;
  cardShare: string;
  cardReminder: string;
  // Reminder & Calendar modal
  reminderModalTitle: string;
  reminderModalSubtitle: string;
  reminderDateTimeLabel: string;
  reminderQuickIn1h: string;
  reminderQuickTonight: string;
  reminderQuickTomorrow: string;
  reminderQuickIn2Days: string;
  reminderBtnGoogle: string;
  reminderBtnPhoneIcs: string;
  reminderSaveToNote: string;
  reminderRemoveFromNote: string;
  reminderSavedSuccess: string;
  reminderRemovedSuccess: string;
  reminderBadgePrefix: string;
  reminderUpcoming: string;
  reminderOverdue: string;
  reminderCalendarHint: string;
  // Share modal
  shareTitle: string;
  shareSubtitle: string;
  shareCopyText: string;
  shareCopyLink: string;
  shareCopied: string;
  shareSystemBtn: string;
  shareDirectText: string;
  shareViaLink: string;
  shareLinkHint: string;
  shareDone: string;
  // Categories mapping
  categories: {
    'Загальне': string;
    'Робота': string;
    'Ідеї': string;
    'Покупки': string;
    'Тренування': string;
    'Особисте'?: string;
    'Тренировка'?: string;
    'Workout'?: string;
    'Общее'?: string;
    'Работа'?: string;
    'Идеи'?: string;
    'Личное'?: string;
    'General'?: string;
    'Work'?: string;
    'Ideas'?: string;
    'Personal'?: string;
    'Shopping'?: string;
    [key: string]: string | undefined;
  };
}

export const translations: Record<Language, Translations> = {
  uk: {
    appName: 'MikeNote',
    publicWallBadge: 'Загальна стіна',
    notesCount: (count: number) => {
      const rem10 = count % 10;
      const rem100 = count % 100;
      if (rem100 >= 11 && rem100 <= 19) return `${count} нотаток`;
      if (rem10 === 1) return `${count} нотатка`;
      if (rem10 >= 2 && rem10 <= 4) return `${count} нотатки`;
      return `${count} нотаток`;
    },
    pinnedCount: (count: number) => `${count} закріплено`,
    newNoteBtn: 'Нова нотатка',
    cloudChecking: 'Перевірка хмари...',
    cloudSyncing: 'Синхронізація...',
    cloudActive: 'Хмара активна',
    cloudSignIn: 'Увійти з Google',
    cloudSignOut: 'Вийти',
    cloudSignInHint: 'Увійдіть з Google для синхронізації особистих нотаток',
    tabPublic: 'Загальні нотатки гостей',
    tabMy: 'Мої особисті',
    tabPublicDesc: 'Будь-який гість може залишити нотатку, і її побачать усі',
    tabMySyncedDesc: 'Синхронізуються у вашому Google-акаунті',
    tabMyLocalDesc: 'Зберігаються лише в цьому браузері (увійдіть для синхронізації)',
    allCategories: 'Всі',
    searchPlaceholderPublic: 'Пошук по загальних нотатках та авторах...',
    searchPlaceholderMy: 'Пошук по особистих нотатках...',
    shownNotes: (count: number, isPublic: boolean) => {
      const rem10 = count % 10;
      const rem100 = count % 100;
      let word = 'нотаток';
      if (rem100 < 11 || rem100 > 19) {
        if (rem10 === 1) word = 'нотатка';
        else if (rem10 >= 2 && rem10 <= 4) word = 'нотатки';
      }
      return `Показано: ${count} ${word}${isPublic ? ' (від усіх гостей)' : ''}`;
    },
    resetSearch: 'Скинути пошук',
    resetFilters: 'Скинути фільтри',
    emptySearchTitle: 'Нотатки не знайдено',
    emptySearchDesc: (q: string) => `За запитом «${q}» нічого не знайдено. Спробуйте змінити формулювання.`,
    emptyPublicTitle: 'На загальній стіні поки немає нотаток',
    emptyPublicDesc: 'Будьте першим гостем! Напишіть нотатку, і її побачать усі відвідувачі в реальному часі.',
    emptyMyTitle: 'Список особистих нотаток порожній',
    emptyMyDesc: 'Створіть свій особистий приватний запис, натиснувши кнопку нижче.',
    writeForEveryone: 'Написати для всіх',
    createFirstNote: 'Створити першу нотатку',
    editNoteTitle: 'Редагування нотатки',
    newPublicNoteTitle: 'Нова публічна нотатка (побачать усі)',
    newMyNoteTitle: 'Нова особиста нотатка',
    hideEditor: 'Приховати',
    receivedBannerTitle: 'Вам надіслано нотатку',
    receivedBannerClose: 'Закрити',
    receivedBannerSave: 'Зберегти в нотатки',
    receivedBannerSaved: 'Збережено!',
    editorTitlePlaceholder: 'Заголовок нотатки (необовʼязково)...',
    editorContentPlaceholder: 'Напишіть щось важливе або цікаве...',
    editorAuthorPlaceholder: 'Ваше імʼя або нікнейм...',
    editorAuthorLabel: 'Автор (буде видно всім)',
    editorCategoryLabel: 'Категорія:',
    editorPinLabel: 'Закріпити вгорі',
    editorPublicLabel: 'Публічна нотатка (на загальну стіну)',
    editorPublicHelp: 'Цю нотатку побачать усі гості в реальному часі',
    editorPrivateHelp: 'Нотатка буде збережена приватно для вас',
    editorSaveBtn: 'Зберегти нотатку',
    editorUpdateBtn: 'Зберегти зміни',
    editorCancelBtn: 'Скасувати',
    editorErrorRequired: 'Будь ласка, введіть текст або заголовок нотатки',
    exerciseNamePlaceholder: 'Назва вправи (напр. Жим лежа)',
    exerciseSetsLabel: 'Підходи',
    exerciseRepsLabel: 'Повторення',
    exerciseSetsPlaceholder: 'Підходи (напр. 4)',
    exerciseRepsPlaceholder: 'Повторення (напр. 10)',
    addExerciseBtn: '+ Додати вправу',
    removeExerciseBtn: 'Видалити вправу',
    workoutSectionTitle: 'Вправи тренування',
    workoutNotesPlaceholder: 'Додаткові примітки до тренування (необовʼязково)...',
    setsShort: 'підх.',
    repsShort: 'повт.',
    cardJustNow: 'Щойно',
    cardGuest: 'Гість',
    cardPublicBadge: 'Загальна',
    cardCopy: 'Копіювати текст',
    cardCopied: 'Скопійовано!',
    cardPin: 'Закріпити',
    cardUnpin: 'Відкріпити',
    cardEdit: 'Редагувати',
    cardDelete: 'Видалити',
    cardShare: 'Поділитися',
    cardReminder: 'Нагадати в календарі',
    reminderModalTitle: 'Нагадування в календар',
    reminderModalSubtitle: 'Додайте нагадування у вбудований календар телефону або Google Календар зі звуковим сигналом',
    reminderDateTimeLabel: 'Дата та час нагадування:',
    reminderQuickIn1h: '+1 год',
    reminderQuickTonight: 'Сьогодні о 19:00',
    reminderQuickTomorrow: 'Завтра о 09:00',
    reminderQuickIn2Days: 'Через 2 дні',
    reminderBtnGoogle: 'Відкрити в Google Календарі',
    reminderBtnPhoneIcs: 'Календар телефону (Apple / Android)',
    reminderSaveToNote: 'Зберегти дату в нотатці',
    reminderRemoveFromNote: 'Прибрати нагадування з нотатки',
    reminderSavedSuccess: 'Нагадування збережено в нотатці!',
    reminderRemovedSuccess: 'Нагадування видалено з нотатки',
    reminderBadgePrefix: '⏰',
    reminderUpcoming: 'Заплановано',
    reminderOverdue: 'Минуло',
    reminderCalendarHint: '💡 При відкритті файлу телефон автоматично запропонує «Додати в Календар» та увімкне системне сповіщення.',
    shareTitle: 'Поділитися нотаткою',
    shareSubtitle: 'Надішліть нотатку другу через месенджер або скопіюйте посилання',
    shareCopyText: 'Скопіювати текст',
    shareCopyLink: 'Скопіювати посилання',
    shareCopied: 'Скопійовано!',
    shareSystemBtn: 'Поділитися через пристрій',
    shareDirectText: 'Надіслати прямо зараз:',
    shareViaLink: 'Або надішліть пряме посилання:',
    shareLinkHint: 'Друг зможе відкрити та зберегти цю нотатку у свій MikeNote.',
    shareDone: 'Готово',
    categories: {
      'Загальне': 'Загальне',
      'Робота': 'Робота',
      'Ідеї': 'Ідеї',
      'Особисте': 'Особисте',
      'Покупки': 'Покупки',
      'Тренування': 'Тренування',
      'Тренировка': 'Тренування',
      'Workout': 'Тренування',
      'Общее': 'Загальне',
      'Работа': 'Робота',
      'Идеи': 'Ідеї',
      'Личное': 'Особисте',
      'General': 'Загальне',
      'Work': 'Робота',
      'Ideas': 'Ідеї',
      'Personal': 'Особисте',
      'Shopping': 'Покупки',
    },
  },
  en: {
    appName: 'MikeNote',
    publicWallBadge: 'Public Wall',
    notesCount: (count: number) => `${count} ${count === 1 ? 'note' : 'notes'}`,
    pinnedCount: (count: number) => `${count} pinned`,
    newNoteBtn: 'New Note',
    cloudChecking: 'Checking cloud...',
    cloudSyncing: 'Syncing...',
    cloudActive: 'Cloud Active',
    cloudSignIn: 'Sign In with Google',
    cloudSignOut: 'Sign Out',
    cloudSignInHint: 'Sign in with Google to sync your personal notes',
    tabPublic: 'Public Guest Notes',
    tabMy: 'My Private Notes',
    tabPublicDesc: 'Any visitor can write a note and everyone will see it',
    tabMySyncedDesc: 'Synced in your Google account',
    tabMyLocalDesc: 'Stored only in this browser (sign in to sync)',
    allCategories: 'All',
    searchPlaceholderPublic: 'Search public notes & authors...',
    searchPlaceholderMy: 'Search personal notes...',
    shownNotes: (count: number, isPublic: boolean) =>
      `Showing: ${count} ${count === 1 ? 'note' : 'notes'}${isPublic ? ' (from all guests)' : ''}`,
    resetSearch: 'Reset search',
    resetFilters: 'Reset filters',
    emptySearchTitle: 'No notes found',
    emptySearchDesc: (q: string) => `Nothing found for "${q}". Try adjusting your query.`,
    emptyPublicTitle: 'No public notes yet',
    emptyPublicDesc: 'Be the first guest! Write a note and all visitors will see it in real-time.',
    emptyMyTitle: 'Your private notes list is empty',
    emptyMyDesc: 'Create your first private note by clicking the button below.',
    writeForEveryone: 'Post for Everyone',
    createFirstNote: 'Create First Note',
    editNoteTitle: 'Edit Note',
    newPublicNoteTitle: 'New Public Note (visible to all)',
    newMyNoteTitle: 'New Private Note',
    hideEditor: 'Hide',
    receivedBannerTitle: 'You received a shared note',
    receivedBannerClose: 'Dismiss',
    receivedBannerSave: 'Save to Notes',
    receivedBannerSaved: 'Saved!',
    editorTitlePlaceholder: 'Note title (optional)...',
    editorContentPlaceholder: 'Write something important or ideas...',
    editorAuthorPlaceholder: 'Your name or nickname...',
    editorAuthorLabel: 'Author (visible to everyone)',
    editorCategoryLabel: 'Category:',
    editorPinLabel: 'Pin to top',
    editorPublicLabel: 'Public note (post to public wall)',
    editorPublicHelp: 'All visitors will see this note in real-time',
    editorPrivateHelp: 'Saved privately for your account only',
    editorSaveBtn: 'Save Note',
    editorUpdateBtn: 'Save Changes',
    editorCancelBtn: 'Cancel',
    editorErrorRequired: 'Please enter note title or content',
    exerciseNamePlaceholder: 'Exercise name (e.g. Bench Press)',
    exerciseSetsLabel: 'Sets',
    exerciseRepsLabel: 'Reps',
    exerciseSetsPlaceholder: 'Sets (e.g. 4)',
    exerciseRepsPlaceholder: 'Reps (e.g. 10)',
    addExerciseBtn: '+ Add Exercise',
    removeExerciseBtn: 'Remove exercise',
    workoutSectionTitle: 'Workout Exercises',
    workoutNotesPlaceholder: 'Additional workout notes (optional)...',
    setsShort: 'sets',
    repsShort: 'reps',
    cardJustNow: 'Just now',
    cardGuest: 'Guest',
    cardPublicBadge: 'Public',
    cardCopy: 'Copy text',
    cardCopied: 'Copied!',
    cardPin: 'Pin',
    cardUnpin: 'Unpin',
    cardEdit: 'Edit',
    cardDelete: 'Delete',
    cardShare: 'Share',
    cardReminder: 'Remind in calendar',
    reminderModalTitle: 'Calendar Reminder',
    reminderModalSubtitle: 'Add a reminder to your phone calendar or Google Calendar with an alarm',
    reminderDateTimeLabel: 'Reminder date & time:',
    reminderQuickIn1h: '+1 hr',
    reminderQuickTonight: 'Tonight at 19:00',
    reminderQuickTomorrow: 'Tomorrow at 09:00',
    reminderQuickIn2Days: 'In 2 days',
    reminderBtnGoogle: 'Open in Google Calendar',
    reminderBtnPhoneIcs: 'Phone Calendar (Apple / Android)',
    reminderSaveToNote: 'Save date to note',
    reminderRemoveFromNote: 'Remove reminder from note',
    reminderSavedSuccess: 'Reminder saved to note!',
    reminderRemovedSuccess: 'Reminder removed from note',
    reminderBadgePrefix: '⏰',
    reminderUpcoming: 'Upcoming',
    reminderOverdue: 'Past',
    reminderCalendarHint: '💡 Opening this file prompts your phone to "Add to Calendar" with a native alarm notification.',
    shareTitle: 'Share Note',
    shareSubtitle: 'Send note to a friend via messenger or copy shareable link',
    shareCopyText: 'Copy text',
    shareCopyLink: 'Copy link',
    shareCopied: 'Copied!',
    shareSystemBtn: 'Share via device',
    shareDirectText: 'Send right away:',
    shareViaLink: 'Or send via direct link:',
    shareLinkHint: 'Your friend can open and save this note to their MikeNote.',
    shareDone: 'Done',
    categories: {
      'Загальне': 'General',
      'Робота': 'Work',
      'Ідеї': 'Ideas',
      'Особисте': 'Personal',
      'Покупки': 'Shopping',
      'Тренування': 'Workout',
      'Тренировка': 'Workout',
      'Workout': 'Workout',
      'Общее': 'General',
      'Работа': 'Work',
      'Идеи': 'Ideas',
      'Личное': 'Personal',
      'General': 'General',
      'Work': 'Work',
      'Ideas': 'Ideas',
      'Personal': 'Personal',
      'Shopping': 'Shopping',
    },
  },
};
