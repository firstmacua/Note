import { AlertCircle, X, ExternalLink } from 'lucide-react';

interface CloudErrorBannerProps {
  error: string | null;
  onDismiss: () => void;
}

export function CloudErrorBanner({ error, onDismiss }: CloudErrorBannerProps) {
  if (!error) return null;

  const isDomainError = error.includes('не добавлен в список разрешенных');

  return (
    <div
      id="cloud-error-banner"
      className="bg-amber-50 border border-amber-300 text-amber-900 rounded-xl p-3.5 shadow-xs flex items-start justify-between gap-3 text-xs animate-in fade-in"
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-amber-950">{error}</p>
          {isDomainError && (
            <p className="text-amber-800 text-[11px] leading-relaxed">
              Чтобы вход работал на вашем домене Vercel, перейдите в{' '}
              <a
                href="https://console.firebase.google.com/"
                target="_blank"
                rel="noreferrer"
                className="underline font-semibold inline-flex items-center gap-0.5 hover:text-amber-950"
              >
                Firebase Console <ExternalLink className="w-3 h-3" />
              </a>{' '}
              → <b>Authentication</b> → <b>Settings</b> → <b>Authorized domains</b> и добавьте ваш адрес (например, <code>vercel.app</code>).
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-amber-700 hover:text-amber-950 p-1 rounded hover:bg-amber-100 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
