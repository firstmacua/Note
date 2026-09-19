import { LogIn, LogOut, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { User } from 'firebase/auth';

interface CloudSyncBarProps {
  currentUser: User | null;
  isAuthLoading: boolean;
  isSyncing: boolean;
  syncError: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function CloudSyncBar({
  currentUser,
  isAuthLoading,
  isSyncing,
  syncError,
  onSignIn,
  onSignOut,
}: CloudSyncBarProps) {
  if (isAuthLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-neutral-400">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Проверка облака...</span>
      </div>
    );
  }

  if (currentUser) {
    return (
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
          {isSyncing ? (
            <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
          ) : (
            <Cloud className="w-3.5 h-3.5 text-emerald-600" />
          )}
          <span className="font-medium hidden sm:inline">
            {isSyncing ? 'Синхронизация...' : 'Облако активно'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={currentUser.displayName || 'User'}
              className="w-7 h-7 rounded-full border border-neutral-300"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-neutral-800 text-white flex items-center justify-center text-xs font-semibold">
              {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}

          <button
            id="cloud-signout-btn"
            type="button"
            onClick={onSignOut}
            title="Выйти из облака"
            className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        id="cloud-signin-btn"
        type="button"
        onClick={onSignIn}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors shadow-xs"
        title="Войти через Google для синхронизации между всеми телефонами и ПК"
      >
        <Cloud className="w-3.5 h-3.5" />
        <span>Синхронизация (Google)</span>
      </button>
      {syncError && (
        <span className="text-[11px] text-red-600 hidden sm:inline">{syncError}</span>
      )}
    </div>
  );
}
