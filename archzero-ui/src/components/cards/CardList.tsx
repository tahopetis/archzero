import { useState, useEffect } from 'react';
import type { Card, CardTypeValue, LifecyclePhaseValue } from '@/types/api';
import { cardApi } from '@/lib/cards';
import { CardGrid } from './CardCard';

interface CardListProps {
  cardTypeFilter?: CardTypeValue;
  lifecyclePhaseFilter?: LifecyclePhaseValue;
  searchQuery?: string;
  tagsFilter?: string[];
  onCardClick?: (card: Card) => void;
}

export function CardList({
  cardTypeFilter,
  lifecyclePhaseFilter,
  searchQuery,
  tagsFilter,
  onCardClick,
}: CardListProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchCards = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        page_size: pageSize,
      };

      if (cardTypeFilter) params.type = cardTypeFilter;
      if (lifecyclePhaseFilter) params.lifecycle_phase = lifecyclePhaseFilter;
      if (searchQuery) params.q = searchQuery;
      if (tagsFilter && tagsFilter.length > 0) params.tags = tagsFilter;

      const response = await cardApi.list(params);
      setCards(response.data);
      setTotal(response.total);
    } catch (err) {
      setError('Failed to load cards');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [page, cardTypeFilter, lifecyclePhaseFilter, searchQuery, tagsFilter]);

  const totalPages = Math.ceil(total / pageSize);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div data-testid="card-list">
      <div className="mb-4 text-sm text-gray-600">
        Showing {cards.length} of {total} cards
      </div>

      <CardGrid cards={cards} onCardClick={onCardClick} />

      {totalPages > 1 && (
        <div data-testid="cards-pagination" className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              data-testid="cards-pagination-prev"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              data-testid="cards-pagination-next"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
