import { useEffect } from "react";
import hotkeys from "hotkeys-js";

// Map some common keys to their event.key values when needed
const keyNameMap: Record<string, string> = {
  arrowleft: 'ArrowLeft',
  arrowright: 'ArrowRight',
  arrowup: 'ArrowUp',
  arrowdown: 'ArrowDown',
  space: 'space',
  enter: 'Enter'
};

export const useHotkeys = (keys: string, callback: () => void) => {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      event.preventDefault();
      callback();
    }

    // Fallback capture-phase listener for cases where a component stops propagation (e.g., sliders)
    const captureHandler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return; // ignore typing in inputs
      }
      // Parse the keys string (supports single combos like 'shift+arrowright')
      const parts = keys.toLowerCase().split('+').map(p => p.trim());
      const hasShift = parts.includes('shift');
      const keyPart = parts.find(p => p !== 'shift' && p !== 'ctrl' && p !== 'alt' && p !== 'meta');
      const expectedKey = keyPart && keyNameMap[keyPart] ? keyNameMap[keyPart] : (keyPart ? keyPart : null);

      if (hasShift && !event.shiftKey) return;
      if (expectedKey) {
        // Some keys are represented differently in KeyboardEvent.key
        if (expectedKey === ' ') {
          if (event.code === 'Space' || event.key === ' ' || event.key === 'Spacebar') {
            event.preventDefault();
            callback();
          }
        } else if (event.key.toLowerCase() === expectedKey.toLowerCase()) {
          event.preventDefault();
          callback();
        }
      }
    };

    hotkeys(keys, handler);
    window.addEventListener('keydown', captureHandler, true);

    return () => {
      hotkeys.unbind(keys, handler);
      window.removeEventListener('keydown', captureHandler, true);
    }
  }, [keys, callback]);
}