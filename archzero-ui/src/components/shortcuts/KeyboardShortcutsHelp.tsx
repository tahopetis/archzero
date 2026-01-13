/**
 * Keyboard Shortcuts Help Panel
 * Display all available keyboard shortcuts
 */

import { X } from 'lucide-react';
import { cn } from '@/components/governance/shared';
import type { KeyboardShortcut } from '@/lib/useKeyboardShortcuts';
import { formatShortcut } from '@/lib/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: {
    context: string;
    shortcuts: KeyboardShortcut[];
  }[];
}

export function KeyboardShortcutsHelp({ isOpen, onClose, shortcuts }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-900">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {shortcuts.map((group) => (
            <div key={group.context} className="mb-6 last:mb-0">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
                {group.context === 'global' ? 'Global Shortcuts' : group.context}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg"
                  >
                    <span className="text-sm text-slate-700">{shortcut.description}</span>
                    <kbd className="px-3 py-1 text-sm font-mono bg-white border border-slate-300 rounded text-slate-900">
                      {formatShortcut(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t bg-slate-50">
          <p className="text-sm text-slate-600 text-center">
            Press <kbd className="px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
