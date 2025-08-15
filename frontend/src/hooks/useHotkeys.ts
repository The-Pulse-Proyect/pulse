import { useEffect } from "react";
import hotkeys from "hotkeys-js";

export const useHotkeys = (keys: string, callback: () => void) => {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      event.preventDefault();
      callback();
    }

    hotkeys(keys, handler);
    return () => {
      hotkeys.unbind(keys, handler);
    }
  }, [keys, callback]);
}