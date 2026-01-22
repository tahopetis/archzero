import { useState, useEffect } from 'react';
import { RelationshipExplorer } from '../components/relationships/RelationshipExplorer';
import { api } from '../lib/api';

export function RelationshipExplorerPage() {
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch cards on page load
    async function fetchCards() {
      try {
        const response = await api.get('/cards');
        // Backend returns paginated response: {data: [...], total, page, page_size}
        const cardsData = response.data.data || response.data;
        setCards(cardsData);

        // Auto-select the first card if available
        if (cardsData && cardsData.length > 0) {
          setSelectedCardId(cardsData[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch cards:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCards();
  }, []);

  return (
    <div className="container mx-auto py-6" data-testid="relationship-explorer-page">
      <h1 className="text-3xl font-bold mb-6">Relationship Explorer</h1>

      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-48 mb-4"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        </div>
      ) : !selectedCardId ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Select a card ID to explore its relationships:
          </p>
          <input
            type="text"
            value={selectedCardId}
            onChange={(e) => setSelectedCardId(e.target.value)}
            placeholder="Enter card ID..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            data-testid="card-id-input"
          />
        </div>
      ) : (
        <div>
          {/* Card selector */}
          <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selected Card:
            </label>
            <select
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="card-selector"
            >
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </select>
          </div>
          <RelationshipExplorer cardId={selectedCardId} />
        </div>
      )}
    </div>
  );
}
