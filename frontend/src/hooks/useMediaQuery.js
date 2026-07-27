import { useState, useEffect } from "react";

/**
 * Returns true when the window matches the given CSS media query string.
 * Handles SSR (returns false on server) and cleans up the listener on unmount.
 *
 * @param {string} query - CSS media query string, e.g. "(max-width: 640px)"
 * @returns {boolean}
 */
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia(query);
    const listener = (e) => setMatches(e.matches);
    // Modern event listener API
    if (media.addEventListener) {
      media.addEventListener("change", listener);
    } else {
      media.addListener(listener); // Safari < 14
    }
    // Sync on mount in case query changed between render and effect
    setMatches(media.matches);
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}
