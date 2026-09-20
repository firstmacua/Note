import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Lightbulb, 
  Plus, 
  Check, 
  Copy, 
  Trash2, 
  X, 
  ChevronDown, 
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { Translations, Language } from '../translations';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  promptTitle?: string;
  saved?: boolean;
}

interface IdeaGeneratorChatProps {
  t: Translations;
  currentLang: Language;
  onAddNoteFromIdea: (idea: { title: string; content: string }) => void;
  onInsertIntoEditor?: (text: string) => void;
  onClose?: () => void;
  isCompact?: boolean;
}

export const IdeaGeneratorChat: React.FC<IdeaGeneratorChatProps> = ({
  t,
  currentLang,
  onAddNoteFromIdea,
  onInsertIntoEditor,
  onClose,
  isCompact = false,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      sender: 'ai',
      text:
        currentLang === 'uk'
          ? 'Привіт! Напишіть мені тему або запит кількома словами (наприклад: "що подарувати татові на день народження"), і я підберу для вас влучні ідеї, які можна одразу зберегти в нотатку.'
          : 'Hello! Type a topic or keywords (e.g. "what to gift dad for his birthday"), and I will generate sharp ideas you can save directly to your notes.',
    },
  ]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const presets = [
    t.ideaPresetGift,
    t.ideaPresetBusiness,
    t.ideaPresetWeekend,
  ];

  const handleSend = async (userPromptText?: string) => {
    const textToSend = (userPromptText || prompt).trim();
    if (!textToSend || isLoading) return;

    setError(null);
    const userMsgId = `user-${Date.now()}`;
    const newMessages: ChatMessage[] = [
      ...messages,
      { id: userMsgId, sender: 'user', text: textToSend },
    ];
    setMessages(newMessages);
    setPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/generate-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          language: currentLang,
          chatHistory: messages.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Помилка генерації ідей');
      }

      const aiMsgId = `ai-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          sender: 'ai',
          text: data.result || '',
          promptTitle: textToSend,
          saved: false,
        },
      ]);
      setLastFailedPrompt(null);
    } catch (err: any) {
      console.error('Failed to generate idea:', err);
      setLastFailedPrompt(textToSend);

      let msg = err?.message || '';
      if (typeof msg === 'string' && (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE') || msg.includes('перевантаж'))) {
        msg =
          currentLang === 'uk'
            ? 'ШІ-сервіс зараз має тимчасово високе навантаження. Натисніть «Спробувати знову».'
            : 'The AI service is experiencing high demand. Please tap "Try again".';
      } else if (!msg) {
        msg = currentLang === 'uk' ? 'Не вдалося згенерувати ідею. Спробуйте ще раз.' : 'Failed to generate ideas. Please try again.';
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToNotes = (msg: ChatMessage) => {
    const title = msg.promptTitle
      ? `${currentLang === 'uk' ? 'Ідеї' : 'Ideas'}: ${msg.promptTitle}`
      : currentLang === 'uk'
      ? 'Нова ідея'
      : 'New Idea';

    onAddNoteFromIdea({
      title,
      content: msg.text,
    });

    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, saved: true } : m))
    );
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'ai',
        text:
          currentLang === 'uk'
            ? 'Чат очищено. Введіть нову тему для ідей!'
            : 'Chat cleared. Enter a new topic for ideas!',
      },
    ]);
  };

  return (
    <div
      id="idea-generator-chat-container"
      className="bg-amber-50/50 border border-amber-200/90 rounded-2xl p-4 sm:p-5 shadow-xs transition-all mb-6 relative overflow-hidden"
    >
      {/* Decorative subtle background gradient */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-36 h-36 bg-amber-200/30 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
              <span>{t.ideaAssistantTitle}</span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900 uppercase">
                AI
              </span>
            </h3>
            <p className="text-xs text-neutral-600 hidden sm:block">
              {t.ideaAssistantSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 2 && (
            <button
              type="button"
              id="clear-idea-chat-btn"
              onClick={handleClear}
              title={t.ideaClearChat}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-amber-100/60 rounded-md transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onClose && (
            <button
              type="button"
              id="close-idea-chat-btn"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-amber-100/60 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Presets chips */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3.5 relative z-10">
        {presets.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(preset.replace(/^[^\s]+\s/, ''))}
            disabled={isLoading}
            className="text-xs bg-white hover:bg-amber-100/80 text-neutral-700 border border-amber-200/80 px-2.5 py-1 rounded-full transition-colors font-medium shadow-2xs hover:shadow-xs disabled:opacity-50"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Chat Messages Feed */}
      <div
        id="idea-chat-feed"
        className="space-y-3 max-h-72 overflow-y-auto pr-1 mb-3.5 text-xs relative z-10"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`rounded-xl px-3.5 py-2.5 max-w-[92%] sm:max-w-[85%] leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-neutral-900 text-white font-medium'
                  : 'bg-white text-neutral-800 border border-amber-200/80 shadow-2xs'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* Actions on AI response */}
              {msg.sender === 'ai' && msg.id !== 'welcome-msg' && (
                <div className="mt-2.5 pt-2 border-t border-amber-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSaveToNotes(msg)}
                      disabled={msg.saved}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                        msg.saved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                          : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shadow-2xs'
                      }`}
                    >
                      {msg.saved ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>{t.ideaSavedSuccess}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3 text-amber-700" />
                          <span>{t.ideaSaveToNotes}</span>
                        </>
                      )}
                    </button>

                    {onInsertIntoEditor && (
                      <button
                        type="button"
                        onClick={() => onInsertIntoEditor(msg.text)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200 bg-white"
                      >
                        <span>В редактор</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(msg.text, msg.id)}
                    className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-800 px-1.5 py-0.5 rounded transition-colors"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>{t.cardCopied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>{t.cardCopy}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-100/60 border border-amber-200/80 px-3.5 py-2 rounded-xl w-fit">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-600" />
            <span>{t.ideaGenerating}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200/90 rounded-xl px-3 py-2 mb-2 relative z-10 shadow-2xs">
          <span>{error}</span>
          {lastFailedPrompt && (
            <button
              type="button"
              id="retry-idea-btn"
              onClick={() => handleSend(lastFailedPrompt)}
              disabled={isLoading}
              className="inline-flex items-center gap-1 font-medium text-[11px] bg-rose-100 hover:bg-rose-200 text-rose-900 px-2 py-0.5 rounded transition-colors shrink-0 disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t.ideaRetryBtn}</span>
            </button>
          )}
        </div>
      )}

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 relative z-10"
      >
        <input
          type="text"
          id="idea-prompt-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t.ideaInputPlaceholder}
          disabled={isLoading}
          className="flex-1 text-xs sm:text-sm bg-white border border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-300 rounded-xl px-3.5 py-2.5 outline-none text-neutral-900 placeholder:text-neutral-400 transition-all shadow-2xs disabled:opacity-60"
        />
        <button
          type="submit"
          id="idea-submit-btn"
          disabled={!prompt.trim() || isLoading}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white rounded-xl text-xs font-medium transition-colors shrink-0 shadow-2xs"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.ideaSendBtn}</span>
        </button>
      </form>
    </div>
  );
};
