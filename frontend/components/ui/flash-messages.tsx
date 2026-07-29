"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CircleAlert, CheckCircle2, Info, X } from "lucide-react";

import { useLocale } from "@/components/i18n/locale-provider";

type FlashTone = "success" | "info" | "error";

type FlashInput = {
  message: string;
  tone?: FlashTone;
  duration?: number;
};

type FlashMessage = Required<FlashInput> & {
  id: number;
  closing: boolean;
};

type FlashContextValue = {
  showFlash: (input: FlashInput) => number;
  dismissFlash: (id: number) => void;
};

const FlashContext = createContext<FlashContextValue | null>(null);

const toneStyles: Record<FlashTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  info: "border-blue-200 bg-blue-50 text-blue-950",
  error: "border-red-200 bg-red-50 text-red-950",
};

const iconStyles: Record<FlashTone, string> = {
  success: "text-emerald-600",
  info: "text-blue-600",
  error: "text-red-600",
};

const toneIcons = {
  success: CheckCircle2,
  info: Info,
  error: CircleAlert,
};

function FlashToast({
  flash,
  onDismiss,
  closeLabel,
}: {
  flash: FlashMessage;
  onDismiss: (id: number) => void;
  closeLabel: string;
}) {
  const Icon = toneIcons[flash.tone];

  return (
    <div
      role={flash.tone === "error" ? "alert" : "status"}
      aria-atomic="true"
      data-closing={flash.closing}
      className={`flash-toast pointer-events-auto flex w-full items-start gap-3 rounded-xl border px-4 py-3 shadow-[0_12px_32px_rgba(16,27,56,0.14)] ${toneStyles[flash.tone]}`}
    >
      <Icon
        aria-hidden="true"
        className={`mt-0.5 shrink-0 ${iconStyles[flash.tone]}`}
        size={19}
      />
      <p className="min-w-0 flex-1 font-inter text-sm font-semibold leading-5">
        {flash.message}
      </p>
      <button
        type="button"
        aria-label={closeLabel}
        className="-mr-1 -mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-current/60 transition-colors hover:bg-black/5 hover:text-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        onClick={() => onDismiss(flash.id)}
      >
        <X aria-hidden="true" size={16} />
      </button>
    </div>
  );
}

export function FlashMessagesProvider({ children }: { children: ReactNode }) {
  const { tr } = useLocale();
  const [flashes, setFlashes] = useState<FlashMessage[]>([]);
  const nextId = useRef(0);

  const dismissFlash = useCallback((id: number) => {
    setFlashes((current) =>
      current.map((flash) =>
        flash.id === id ? { ...flash, closing: true } : flash,
      ),
    );
    window.setTimeout(() => {
      setFlashes((current) => current.filter((flash) => flash.id !== id));
    }, 140);
  }, []);

  const showFlash = useCallback(
    ({ message, tone = "success", duration = 5000 }: FlashInput) => {
      const id = ++nextId.current;
      setFlashes((current) => [
        ...current.filter((flash) => !flash.closing),
        { id, message, tone, duration, closing: false },
      ].slice(-4));
      window.setTimeout(() => dismissFlash(id), duration);
      return id;
    },
    [dismissFlash],
  );

  return (
    <FlashContext.Provider value={{ showFlash, dismissFlash }}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed inset-x-4 top-20 z-[100] flex flex-col gap-3 sm:inset-x-auto sm:right-6 sm:w-[min(400px,calc(100vw-3rem))]"
      >
        {flashes.map((flash) => (
          <FlashToast
            key={flash.id}
            flash={flash}
            closeLabel={tr({
              en: "Close notification",
              ru: "Закрыть уведомление",
              "zh-Hans": "关闭通知",
            })}
            onDismiss={dismissFlash}
          />
        ))}
      </div>
    </FlashContext.Provider>
  );
}

export function useFlashMessages() {
  const context = useContext(FlashContext);
  if (!context) {
    throw new Error("useFlashMessages must be used within FlashMessagesProvider");
  }
  return context;
}
