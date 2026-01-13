/**
 * Keyboard Shortcuts Provider
 * Global context for keyboard shortcuts
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { KeyboardShortcut } from '@/lib/useKeyboardShortcuts';

interface KeyboardShortcutContextType {
  shortcuts: KeyboardShortcut[];
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (key: string, context?: string) => void;
  showHelp: boolean;
  toggleHelp: () => void;
}

const KeyboardShortcutContext = createContext<KeyboardShortcutContextType | undefined>(undefined);

interface KeyboardShortcutProviderProps {
  children: ReactNode;
}

export function KeyboardShortcutProvider({ children }: KeyboardShortcutProviderProps) {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts((prev) => {
      // Check for conflicts
      const conflict = prev.find(
        (s) =>
          s.key.toLowerCase() === shortcut.key.toLowerCase() &&
          s.metaKey === shortcut.metaKey &&
          s.ctrlKey === shortcut.ctrlKey &&
          s.shiftKey === shortcut.shiftKey &&
          s.altKey === shortcut.altKey
      );

      if (conflict) {
        console.warn(`Keyboard shortcut conflict detected: ${shortcut.key}`, {
          existing: conflict,
          new: shortcut,
        });
      }

      return [...prev, shortcut];
    });
  }, []);

  const unregisterShortcut = useCallback((key: string, context?: string) => {
    setShortcuts((prev) =>
      prev.filter(
        (s) => !(s.key.toLowerCase() === key.toLowerCase() && (!context || s.context === context))
      )
    );
  }, []);

  const toggleHelp = useCallback(() => {
    setShowHelp((prev) => !prev);
  }, []);

  return (
    <KeyboardShortcutContext.Provider
      value={{
        shortcuts,
        registerShortcut,
        unregisterShortcut,
        showHelp,
        toggleHelp,
      }}
    >
      {children}
    </KeyboardShortcutContext.Provider>
  );
}

export function useKeyboardShortcutContext() {
  const context = useContext(KeyboardShortcutContext);
  if (!context) {
    throw new Error('useKeyboardShortcutContext must be used within KeyboardShortcutProvider');
  }
  return context;
}
