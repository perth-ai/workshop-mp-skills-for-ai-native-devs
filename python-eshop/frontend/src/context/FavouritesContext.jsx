import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const FavouritesContext = createContext(null);

function withId(ids, id, included) {
  const next = new Set(ids);
  if (included) next.add(id);
  else next.delete(id);
  return next;
}

export function FavouritesProvider({ children }) {
  const { email, isAuthenticated } = useAuth();
  const [favouriteIds, setFavouriteIds] = useState(() => new Set());
  const [pendingIds, setPendingIds] = useState(() => new Set());
  // Bumped whenever the signed-in User changes, so late responses from an
  // earlier session can't write into this one.
  const sessionRef = useRef(0);
  const pendingRef = useRef(pendingIds);
  pendingRef.current = pendingIds;

  // Loaded at login, or at app start when a token exists; cleared at logout.
  useEffect(() => {
    sessionRef.current += 1;
    setFavouriteIds(new Set());
    setPendingIds(new Set());
    if (!isAuthenticated) return undefined;

    let cancelled = false;
    api
      .getFavouriteIds()
      .then((ids) => {
        if (cancelled) return;
        setFavouriteIds((current) => {
          const next = new Set(ids);
          // Keep the optimistic state of toggles still in flight.
          pendingRef.current.forEach((id) => {
            if (current.has(id)) next.add(id);
            else next.delete(id);
          });
          return next;
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [email, isAuthenticated]);

  const toggleFavourite = useCallback(
    async (catalogItemId) => {
      // One request per item at a time, so rapid clicks can't race each other.
      if (pendingIds.has(catalogItemId)) return;

      const session = sessionRef.current;
      const wasFavourite = favouriteIds.has(catalogItemId);
      setPendingIds((ids) => withId(ids, catalogItemId, true));
      setFavouriteIds((ids) => withId(ids, catalogItemId, !wasFavourite));
      try {
        if (wasFavourite) await api.removeFavourite(catalogItemId);
        else await api.saveFavourite(catalogItemId);
      } catch (error) {
        if (sessionRef.current !== session) return;
        setFavouriteIds((ids) => withId(ids, catalogItemId, wasFavourite));
        throw error;
      } finally {
        setPendingIds((ids) => withId(ids, catalogItemId, false));
      }
    },
    [favouriteIds, pendingIds],
  );

  const value = useMemo(
    () => ({
      isFavourite: (catalogItemId) => favouriteIds.has(catalogItemId),
      isPending: (catalogItemId) => pendingIds.has(catalogItemId),
      toggleFavourite,
    }),
    [favouriteIds, pendingIds, toggleFavourite],
  );

  return <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>;
}

export function useFavourites() {
  const context = useContext(FavouritesContext);
  if (!context) {
    throw new Error('useFavourites must be used within FavouritesProvider');
  }
  return context;
}
