'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, HelpCircle, X } from 'lucide-react';

const emptySubscribe = () => () => {};

export type DialogVariant = 'danger' | 'warning' | 'primary';

export interface ConfirmOptions {
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
}

export interface PromptOptions {
  title?: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  inputType?: string;
}

interface DialogState {
  isOpen: boolean;
  type: 'confirm' | 'prompt';
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: DialogVariant;
  promptValue: string;
  promptPlaceholder: string;
  promptInputType: string;
  confirmResolve: ((val: boolean) => void) | null;
  promptResolve: ((val: string | null) => void) | null;
}

interface ConfirmContextType {
  confirm: (optionsOrMessage: string | ConfirmOptions) => Promise<boolean>;
  prompt: (optionsOrMessage: string | PromptOptions) => Promise<string | null>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    type: 'confirm',
    title: '',
    description: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    variant: 'danger',
    promptValue: '',
    promptPlaceholder: '',
    promptInputType: 'text',
    confirmResolve: null,
    promptResolve: null,
  });

  const confirm = useCallback((optionsOrMessage: string | ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      let title = 'Confirm Action';
      let description = '';
      let confirmLabel = 'Confirm';
      let cancelLabel = 'Cancel';
      let variant: DialogVariant = 'danger';

      if (typeof optionsOrMessage === 'string') {
        description = optionsOrMessage;
        const lower = description.toLowerCase();
        if (lower.includes('delete') || lower.includes('remove') || lower.includes('clear')) {
          title = 'Delete Confirmation';
          variant = 'danger';
          confirmLabel = 'Delete';
        } else if (lower.includes('revoke') || lower.includes('disconnect')) {
          title = 'Warning';
          variant = 'warning';
          confirmLabel = 'Proceed';
        }
      } else {
        description = optionsOrMessage.description;
        title = optionsOrMessage.title || 'Confirm Action';
        confirmLabel = optionsOrMessage.confirmLabel || optionsOrMessage.confirmText || 'Confirm';
        cancelLabel = optionsOrMessage.cancelLabel || optionsOrMessage.cancelText || 'Cancel';
        variant = optionsOrMessage.variant || 'danger';
      }

      setDialogState({
        isOpen: true,
        type: 'confirm',
        title,
        description,
        confirmLabel,
        cancelLabel,
        variant,
        promptValue: '',
        promptPlaceholder: '',
        promptInputType: 'text',
        confirmResolve: resolve,
        promptResolve: null,
      });
    });
  }, []);

  const prompt = useCallback((optionsOrMessage: string | PromptOptions): Promise<string | null> => {
    return new Promise<string | null>((resolve) => {
      let title = 'Enter Information';
      let description = '';
      let confirmLabel = 'Submit';
      let cancelLabel = 'Cancel';
      let placeholder = '';
      let defaultValue = '';
      let inputType = 'text';

      if (typeof optionsOrMessage === 'string') {
        description = optionsOrMessage;
      } else {
        title = optionsOrMessage.title || 'Enter Information';
        description = optionsOrMessage.description || '';
        confirmLabel = optionsOrMessage.confirmLabel || 'Submit';
        cancelLabel = optionsOrMessage.cancelLabel || 'Cancel';
        placeholder = optionsOrMessage.placeholder || '';
        defaultValue = optionsOrMessage.defaultValue || '';
        inputType = optionsOrMessage.inputType || 'text';
      }

      setDialogState({
        isOpen: true,
        type: 'prompt',
        title,
        description,
        confirmLabel,
        cancelLabel,
        variant: 'primary',
        promptValue: defaultValue,
        promptPlaceholder: placeholder,
        promptInputType: inputType,
        confirmResolve: null,
        promptResolve: resolve,
      });
    });
  }, []);

  const handleClose = useCallback(
    (confirmed: boolean) => {
      if (dialogState.type === 'confirm' && dialogState.confirmResolve) {
        dialogState.confirmResolve(confirmed);
      } else if (dialogState.type === 'prompt' && dialogState.promptResolve) {
        dialogState.promptResolve(confirmed ? dialogState.promptValue : null);
      }
      setDialogState((prev) => ({
        ...prev,
        isOpen: false,
        confirmResolve: null,
        promptResolve: null,
      }));
    },
    [dialogState],
  );

  useEffect(() => {
    if (!dialogState.isOpen) return;

    if (dialogState.type === 'prompt' && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose(false);
      } else if (e.key === 'Enter') {
        if (e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        handleClose(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogState.isOpen, dialogState.type, handleClose]);

  const renderIcon = () => {
    if (dialogState.variant === 'danger') {
      return (
        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0">
          <Trash2 className="w-5 h-5" />
        </div>
      );
    }
    if (dialogState.variant === 'warning') {
      return (
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-accent-subtle text-accent border border-accent/20 flex items-center justify-center shrink-0">
        <HelpCircle className="w-5 h-5" />
      </div>
    );
  };

  const getConfirmButtonStyles = () => {
    if (dialogState.variant === 'danger') {
      return 'bg-red-600 hover:bg-red-700 text-white';
    }
    if (dialogState.variant === 'warning') {
      return 'bg-amber-600 hover:bg-amber-700 text-white';
    }
    return 'bg-[#111113] hover:bg-black text-white';
  };

  return (
    <ConfirmContext.Provider value={{ confirm, prompt }}>
      {children}
      {isMounted && dialogState.isOpen &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            {/* Full-screen dark backdrop */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
              onClick={() => handleClose(false)}
            />

            {/* Modal Dialog Box */}
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="dialog-title"
              className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl border border-border overflow-hidden animate-fade-in"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/70">
                <h3 id="dialog-title" className="text-sm font-semibold text-text-primary">
                  {dialogState.title}
                </h3>
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {renderIcon()}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <p className="text-sm text-text-primary font-medium leading-snug">
                      {dialogState.title}
                    </p>
                    {dialogState.description ? (
                      <p className="text-xs text-text-muted leading-relaxed">
                        {dialogState.description}
                      </p>
                    ) : null}

                    {/* Prompt input field */}
                    {dialogState.type === 'prompt' && (
                      <div className="pt-2">
                        <input
                          ref={inputRef}
                          type={dialogState.promptInputType}
                          value={dialogState.promptValue}
                          onChange={(e) =>
                            setDialogState((prev) => ({
                              ...prev,
                              promptValue: e.target.value,
                            }))
                          }
                          placeholder={dialogState.promptPlaceholder}
                          className="w-full px-3 py-2 text-xs bg-sidebar border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-text-primary/10 focus:border-text-primary/40 transition-all"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-sidebar/50 border-t border-border/70 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary bg-white hover:bg-base border border-border rounded-xl transition-colors cursor-pointer"
                >
                  {dialogState.cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={() => handleClose(true)}
                  className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer shadow-xs ${getConfirmButtonStyles()}`}
                >
                  {dialogState.confirmLabel}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}

export function usePrompt() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('usePrompt must be used within a ConfirmProvider');
  }
  return context.prompt;
}
