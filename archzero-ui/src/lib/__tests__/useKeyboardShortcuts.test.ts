/**
 * Keyboard Shortcuts Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts, formatShortcut, findConflicts } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('should register keyboard event listener on mount', () => {
    const shortcuts = [
      {
        key: 'k',
        metaKey: true,
        description: 'Test shortcut',
        action: vi.fn(),
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should call action when matching shortcut is pressed', () => {
    const action = vi.fn();
    const shortcuts = [
      {
        key: 'k',
        metaKey: true,
        description: 'Test shortcut',
        action,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Get the event handler
    const eventHandler = addEventListenerSpy.mock.calls[0][1];

    // Simulate Cmd+K keypress
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      ctrlKey: true,
    });
    act(() => {
      eventHandler(event);
    });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('should not call action when shortcut does not match', () => {
    const action = vi.fn();
    const shortcuts = [
      {
        key: 'k',
        metaKey: true,
        description: 'Test shortcut',
        action,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    const eventHandler = addEventListenerSpy.mock.calls[0][1];

    // Simulate wrong key
    const event = new KeyboardEvent('keydown', {
      key: 'l',
      metaKey: true,
    });
    act(() => {
      eventHandler(event);
    });

    expect(action).not.toHaveBeenCalled();
  });

  it('should respect context filtering', () => {
    const action1 = vi.fn();
    const action2 = vi.fn();

    const shortcuts = [
      {
        key: 'k',
        metaKey: true,
        description: 'Global shortcut',
        action: action1,
        context: 'global' as const,
      },
      {
        key: 'k',
        metaKey: true,
        description: 'Cards shortcut',
        action: action2,
        context: 'cards' as const,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts, 'cards'));

    const eventHandler = addEventListenerSpy.mock.calls[0][1];

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
    });
    act(() => {
      eventHandler(event);
    });

    // Both should be called since 'cards' matches context and 'global' works everywhere
    expect(action1).toHaveBeenCalledTimes(1);
    expect(action2).toHaveBeenCalledTimes(1);
  });

  it('should prevent default behavior when shortcut matches', () => {
    const action = vi.fn();
    const shortcuts = [
      {
        key: 'k',
        metaKey: true,
        description: 'Test shortcut',
        action,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    const eventHandler = addEventListenerSpy.mock.calls[0][1];

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
    });
    const preventDefault = vi.spyOn(event, 'preventDefault');

    act(() => {
      eventHandler(event);
    });

    expect(preventDefault).toHaveBeenCalled();
  });

  it('should clean up event listener on unmount', () => {
    const { unmount } = renderHook(
      () =>
        useKeyboardShortcuts([
          {
            key: 'k',
            metaKey: true,
            description: 'Test',
            action: vi.fn(),
          },
        ])
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});

describe('formatShortcut', () => {
  it('should format simple key', () => {
    const shortcut = {
      key: 'k',
      description: 'Test',
      action: vi.fn(),
    };

    expect(formatShortcut(shortcut)).toBe('K');
  });

  it('should format Cmd+K', () => {
    const shortcut = {
      key: 'k',
      metaKey: true,
      description: 'Test',
      action: vi.fn(),
    };

    expect(formatShortcut(shortcut)).toBe('⌘ + K');
  });

  it('should format Cmd+Shift+K', () => {
    const shortcut = {
      key: 'k',
      metaKey: true,
      shiftKey: true,
      description: 'Test',
      action: vi.fn(),
    };

    expect(formatShortcut(shortcut)).toBe('⌘ + ⇧ + K');
  });

  it('should format Ctrl+Alt+Delete', () => {
    const shortcut = {
      key: 'Delete',
      ctrlKey: true,
      altKey: true,
      description: 'Test',
      action: vi.fn(),
    };

    expect(formatShortcut(shortcut)).toBe('Ctrl + ⌥ + DELETE');
  });
});

describe('findConflicts', () => {
  it('should detect conflicting shortcuts', () => {
    const shortcuts = [
      {
        key: 'k',
        metaKey: true,
        description: 'First',
        action: vi.fn(),
      },
      {
        key: 'k',
        metaKey: true,
        description: 'Second (conflict)',
        action: vi.fn(),
      },
    ];

    const conflicts = findConflicts(shortcuts);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toHaveLength(2);
  });

  it('should not detect conflicts for different keys', () => {
    const shortcuts = [
      {
        key: 'k',
        metaKey: true,
        description: 'First',
        action: vi.fn(),
      },
      {
        key: 'l',
        metaKey: true,
        description: 'Second',
        action: vi.fn(),
      },
    ];

    const conflicts = findConflicts(shortcuts);

    expect(conflicts).toHaveLength(0);
  });

  it('should not detect conflicts for different modifiers', () => {
    const shortcuts = [
      {
        key: 'k',
        metaKey: true,
        description: 'First',
        action: vi.fn(),
      },
      {
        key: 'k',
        shiftKey: true,
        description: 'Second',
        action: vi.fn(),
      },
    ];

    const conflicts = findConflicts(shortcuts);

    expect(conflicts).toHaveLength(0);
  });
});
