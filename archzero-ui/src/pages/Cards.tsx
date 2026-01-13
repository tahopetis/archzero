import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Card, CardTypeValue, LifecyclePhaseValue } from '@/types/api';
import { CardList } from '../components/cards';

export function CardsPage() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<CardTypeValue | undefined>();
  const [selectedPhase, setSelectedPhase] = useState<LifecyclePhaseValue | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  const handleCardClick = (card: Card) => {
    navigate(`/cards/${card.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Cards</h1>
          <button
            onClick={() => navigate('/cards/new')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Card
          </button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={selectedType || ''}
            onChange={(e) => setSelectedType(e.target.value as CardTypeValue | undefined)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            <option value="BusinessCapability">Business Capability</option>
            <option value="Objective">Objective</option>
            <option value="Application">Application</option>
            <option value="Interface">Interface</option>
            <option value="ITComponent">IT Component</option>
            <option value="Platform">Platform</option>
          </select>
          <select
            value={selectedPhase || ''}
            onChange={(e) => setSelectedPhase(e.target.value as LifecyclePhaseValue | undefined)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Phases</option>
            <option value="Discovery">Discovery</option>
            <option value="Strategy">Strategy</option>
            <option value="Planning">Planning</option>
            <option value="Development">Development</option>
            <option value="Testing">Testing</option>
            <option value="Active">Active</option>
            <option value="Decommissioned">Decommissioned</option>
            <option value="Retired">Retired</option>
          </select>
        </div>
      </div>

      <CardList
        cardTypeFilter={selectedType}
        lifecyclePhaseFilter={selectedPhase}
        searchQuery={searchQuery}
        onCardClick={handleCardClick}
      />
    </div>
  );
}
