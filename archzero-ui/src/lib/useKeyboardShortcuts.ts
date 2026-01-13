/**
 * Keyboard Shortcuts Hook
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  action: () => void;
  context?: string; // 'global' | 'cards' | 'governance' | etc.
}

interface ShortcutGroup {
  context: string;
  shortcuts: KeyboardShortcut[];
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  currentContext: string = 'global'
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in an input field
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.getAttribute('contenteditable') === 'true';

      // Find matching shortcut
      const matchingShortcut = shortcuts.find((shortcut) => {
        // Check context
        if (shortcut.context && shortcut.context !== 'global' && shortcut.context !== currentContext) {
          return false;
        }

        // Check modifiers
        if (shortcut.metaKey !== undefined && shortcut.metaKey !== (e.metaKey || e.ctrlKey)) {
          return false;
        }
        if (shortcut.ctrlKey !== undefined && shortcut.ctrlKey !== e.ctrlKey) {
          return false;
        }
        if (shortcut.shiftKey !== undefined && shortcut.shiftKey !== e.shiftKey) {
          return false;
        }
        if (shortcut.altKey !== undefined && shortcut.altKey !== e.altKey) {
          return false;
        }

        // Check key
        return e.key.toLowerCase() === shortcut.key.toLowerCase();
      });

      if (matchingShortcut) {
        e.preventDefault();
        matchingShortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, currentContext]);
}

// Predefined shortcuts
export const GLOBAL_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'k',
    metaKey: true,
    description: 'Open global search',
    action: () => {
      // This will be set by the component
    },
    context: 'global',
  },
  {
    key: '/',
    metaKey: true,
    description: 'Show keyboard shortcuts',
    action: () => {},
    context: 'global',
  },
  {
    key: 'n',
    metaKey: true,
    description: 'Create new card',
    action: () => {},
    context: 'cards',
  },
  {
    key: 'b',
    metaKey: true,
    shiftKey: true,
    description: 'Open bulk import',
    action: () => {},
    context: 'global',
  },
  {
    key: 'e',
    metaKey: true,
    shiftKey: true,
    description: 'Open export panel',
    action: () => {},
    context: 'global',
  },
];

export const CARDS_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'f',
    description: 'Focus search',
    action: () => {},
    context: 'cards',
  },
  {
    key: 'a',
    metaKey: true,
    description: 'Select all cards',
    action: () => {},
    context: 'cards',
  },
  {
    key: 'd',
    description: 'Duplicate selected card',
    action: () => {},
    context: 'cards',
  },
  {
    key: 'Escape',
    description: 'Clear selection',
    action: () => {},
    context: 'cards',
  },
];

export const GOVERNANCE_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'p',
    description: 'Go to principles',
    action: () => {},
    context: 'governance',
  },
  {
    key: 's',
    description: 'Go to standards',
    action: () => {},
    context: 'governance',
  },
  {
    key: 'o',
    description: 'Go to policies',
    action: () => {},
    context: 'governance',
  },
  {
    key: 'r',
    description: 'Go to risks',
    action: () => {},
    context: 'governance',
  },
];

// Helper to format shortcuts for display
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.metaKey) {
    parts.push('⌘');
  }
  if (shortcut.ctrlKey) {
    parts.push('Ctrl');
  }
  if (shortcut.shiftKey) {
    parts.push('⇧');
  }
  if (shortcut.altKey) {
    parts.push('⌥');
  }

  parts.push(shortcut.key.toUpperCase());

  return parts.join(' + ');
}

// Check for conflicts
export function findConflicts(shortcuts: KeyboardShortcut[]): KeyboardShortcut[][] {
  const conflicts: KeyboardShortcut[][] = [];
  const seen = new Map<string, KeyboardShortcut[]>();

  shortcuts.forEach((shortcut) => {
    const key = serializeShortcut(shortcut);
    if (seen.has(key)) {
      conflicts.push([...(seen.get(key) || []), shortcut]);
    } else {
      seen.set(key, [shortcut]);
    }
  });

  return conflicts;
}

function serializeShortcut(shortcut: KeyboardShortcut): string {
  return JSON.stringify({
    key: shortcut.key.toLowerCase(),
    metaKey: shortcut.metaKey || false,
    ctrlKey: shortcut.ctrlKey || false,
    shiftKey: shortcut.shiftKey || false,
    altKey: shortcut.altKey || false,
  });
}
