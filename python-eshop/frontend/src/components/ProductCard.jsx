import { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useFavourites } from '../context/FavouritesContext';

export default function ProductCard({ item, onAdded }) {
  const { isAuthenticated, refreshBasket } = useAuth();
  const { isFavourite, isPending, toggleFavourite } = useFavourites();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [favouriteError, setFavouriteError] = useState('');
  const favourite = isFavourite(item.id);

  async function handleAdd() {
    setLoading(true);
    setMessage('');
    try {
      await api.addToBasket(item.id);
      await refreshBasket();
      setMessage('Added!');
      onAdded?.();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFavourite() {
    setFavouriteError('');
    try {
      await toggleFavourite(item.id);
    } catch (error) {
      setFavouriteError(error.message);
    }
  }

  return (
    <article className="card flex flex-col overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <img
          src={item.picture_uri}
          alt={item.name}
          className="h-full w-full object-cover"
        />
        {isAuthenticated && (
          <button
            type="button"
            onClick={handleToggleFavourite}
            disabled={isPending(item.id)}
            aria-pressed={favourite}
            aria-label={favourite ? `Remove ${item.name} from favourites` : `Save ${item.name} to favourites`}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:bg-white"
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-5 w-5 ${favourite ? 'fill-rose-500 stroke-rose-500' : 'fill-none stroke-slate-500'}`}
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.1 5.2 3 1.6-1.9 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
            {item.brand_name} · {item.type_name}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{item.name}</h3>
          <p className="mt-2 text-sm text-slate-500 line-clamp-2">{item.description}</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xl font-bold text-slate-900">${item.price.toFixed(2)}</p>
          <button
            type="button"
            onClick={handleAdd}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Adding...' : 'Add to basket'}
          </button>
        </div>
        {message && <p className="text-xs font-medium text-emerald-600">{message}</p>}
        {favouriteError && <p className="text-xs font-medium text-red-600">{favouriteError}</p>}
      </div>
    </article>
  );
}
