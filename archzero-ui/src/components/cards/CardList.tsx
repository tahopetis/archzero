import { useState, useEffect } from 'react';
import type { Card, CardTypeValue, LifecyclePhaseValue } from '@/types/api';
import { cardApi } from '@/lib/cards';
import { CardGrid } from './CardCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';

interface CardListProps {
  cardTypeFilter?: CardTypeValue;
  lifecyclePhaseFilter?: LifecyclePhaseValue;
  searchQuery?: string;
  tagsFilter?: string[];
  onCardClick?: (card: Card) => void;
  selectedCardIds?: Set<string>;
  onToggleSelect?: (cardId: string) => void;
  showCheckboxes?: boolean;
  onCardIdsLoaded?: (cardIds: string[]) => void;
}

export function CardList({
  cardTypeFilter,
  lifecyclePhaseFilter,
  searchQuery,
  tagsFilter,
  onCardClick,
  selectedCardIds,
  onToggleSelect,
  showCheckboxes = false,
  onCardIdsLoaded,
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

  // Notify parent of loaded card IDs for "select all" functionality
  useEffect(() => {
    if (onCardIdsLoaded && cards.length > 0) {
      onCardIdsLoaded(cards.map(c => c.id));
    }
  }, [cards, onCardIdsLoaded]);

  const totalPages = Math.ceil(total / pageSize);

  if (loading) {
    return (
      <LoadingState
        message="Loading cards..."
        size="lg"
      />
    );
  }

  if (error) {
    return (
      <div data-testid="card-list">
        <ErrorState
          title="Failed to load cards"
          message={error}
          onRetry={() => fetchCards()}
          errorType="network"
        />
      </div>
    );
  }

  return (
    <div data-testid="card-list">
      <div className="mb-4 text-sm text-gray-600">
        Showing {cards.length} of {total} cards
      </div>

      <CardGrid
        cards={cards}
        onCardClick={onCardClick}
        selectedCardIds={selectedCardIds}
        onToggleSelect={onToggleSelect}
        showCheckboxes={showCheckboxes}
      />

      {totalPages > 1 && (
        <div data-testid="pagination" className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              data-testid="previous-page"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              data-testid="next-page"
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
