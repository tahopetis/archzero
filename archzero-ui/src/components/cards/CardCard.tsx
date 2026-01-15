import type { Card, CardTypeValue, LifecyclePhaseValue } from '@/types/api';

interface CardCardProps {
  card: Card;
  onClick?: () => void;
  selected?: boolean;
  onToggleSelect?: (cardId: string) => void;
  showCheckbox?: boolean;
}

const cardTypeColors: Record<CardTypeValue, string> = {
  BusinessCapability: 'bg-purple-100 text-purple-800 border-purple-200',
  Objective: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  Application: 'bg-blue-100 text-blue-800 border-blue-200',
  Interface: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  ITComponent: 'bg-green-100 text-green-800 border-green-200',
  Platform: 'bg-teal-100 text-teal-800 border-teal-200',
  ArchitecturePrinciple: 'bg-rose-100 text-rose-800 border-rose-200',
  TechnologyStandard: 'bg-orange-100 text-orange-800 border-orange-200',
  ArchitecturePolicy: 'bg-amber-100 text-amber-800 border-amber-200',
  Exception: 'bg-red-100 text-red-800 border-red-200',
  Initiative: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Risk: 'bg-pink-100 text-pink-800 border-pink-200',
  ComplianceRequirement: 'bg-violet-100 text-violet-800 border-violet-200',
};

const lifecyclePhaseColors: Record<LifecyclePhaseValue, string> = {
  Discovery: 'bg-gray-100 text-gray-600',
  Strategy: 'bg-slate-100 text-slate-600',
  Planning: 'bg-blue-50 text-blue-600',
  Development: 'bg-yellow-50 text-yellow-600',
  Testing: 'bg-orange-50 text-orange-600',
  Active: 'bg-green-50 text-green-600',
  Decommissioned: 'bg-red-50 text-red-600',
  Retired: 'bg-gray-50 text-gray-500',
};

export function CardCard({ card, onClick, selected = false, onToggleSelect, showCheckbox = false }: CardCardProps) {
  const typeColor = cardTypeColors[card.type] || 'bg-gray-100 text-gray-800';
  const phaseColor = lifecyclePhaseColors[card.lifecyclePhase] || 'bg-gray-100 text-gray-600';

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onToggleSelect?.(card.id);
  };

  return (
    <div
      data-testid={`card-${card.id}`}
      data-card-name={card.name}
      onClick={onClick}
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-200 cursor-pointer relative ${
        selected ? 'ring-2 ring-indigo-500' : ''
      }`}
    >
      {showCheckbox && (
        <div className="absolute top-4 left-4 z-10" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={handleCheckboxChange}
            className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
          />
        </div>
      )}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 flex-1">{card.name}</h3>
        {card.qualityScore !== undefined && (
          <div className="ml-3 flex items-center">
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  card.qualityScore >= 80 ? 'bg-green-500' :
                  card.qualityScore >= 60 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${card.qualityScore}%` }}
              />
            </div>
            <span className="ml-2 text-sm text-gray-600">{card.qualityScore}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className={`px-2 py-1 rounded-md text-xs font-medium border ${typeColor}`}>
          {card.type}
        </span>
        <span className={`px-2 py-1 rounded-md text-xs font-medium ${phaseColor}`}>
          {card.lifecyclePhase}
        </span>
      </div>

      {card.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{card.description}</p>
      )}

      {card.tags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {card.tags.slice(0, 3).map((tag: string) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
            >
              {tag}
            </span>
          ))}
          {card.tags.length > 3 && (
            <span className="px-2 py-0.5 text-gray-500 text-xs">
              +{card.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Updated: {new Date(card.updatedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

interface CardGridProps {
  cards: Card[];
  onCardClick?: (card: Card) => void;
  selectedCardIds?: Set<string>;
  onToggleSelect?: (cardId: string) => void;
  showCheckboxes?: boolean;
}

export function CardGrid({ cards, onCardClick, selectedCardIds, onToggleSelect, showCheckboxes = false }: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No cards</h3>
        <p className="mt-1 text-sm text-gray-500">No cards found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <CardCard
          key={card.id}
          card={card}
          onClick={() => onCardClick?.(card)}
          selected={selectedCardIds?.has(card.id)}
          onToggleSelect={onToggleSelect}
          showCheckbox={showCheckboxes}
        />
      ))}
    </div>
  );
}
