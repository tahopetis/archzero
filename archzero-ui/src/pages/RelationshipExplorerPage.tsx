import { useState } from 'react';
import { RelationshipExplorer } from '../components/relationships/RelationshipExplorer';

export function RelationshipExplorerPage() {
  // For now, we'll use a state to select which card to explore
  // In a real implementation, this might come from URL params or a card selector
  const [selectedCardId, setSelectedCardId] = useState<string>('');

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Relationship Explorer</h1>

      {!selectedCardId ? (
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
        <RelationshipExplorer cardId={selectedCardId} />
      )}
    </div>
  );
}
