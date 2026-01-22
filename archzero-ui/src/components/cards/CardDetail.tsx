import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Card } from '@/types/api';
import { cardApi } from '@/lib/cards';
import { useImpactAnalysis } from '@/lib/relationship-hooks';
import { relationshipApi } from '@/lib/relationships';

const cardTypeColors: Record<string, string> = {
  BusinessCapability: 'bg-purple-100 text-purple-800',
  Objective: 'bg-indigo-100 text-indigo-800',
  Application: 'bg-blue-100 text-blue-800',
  Interface: 'bg-cyan-100 text-cyan-800',
  ITComponent: 'bg-green-100 text-green-800',
  Platform: 'bg-teal-100 text-teal-800',
  ArchitecturePrinciple: 'bg-rose-100 text-rose-800',
  TechnologyStandard: 'bg-orange-100 text-orange-800',
  ArchitecturePolicy: 'bg-amber-100 text-amber-800',
  Exception: 'bg-red-100 text-red-800',
  Initiative: 'bg-yellow-100 text-yellow-800',
  Risk: 'bg-pink-100 text-pink-800',
  ComplianceRequirement: 'bg-violet-100 text-violet-800',
};

const lifecyclePhaseColors: Record<string, string> = {
  Discovery: 'bg-gray-100 text-gray-600',
  Strategy: 'bg-slate-100 text-slate-600',
  Planning: 'bg-blue-50 text-blue-600',
  Development: 'bg-yellow-50 text-yellow-600',
  Testing: 'bg-orange-50 text-orange-600',
  Active: 'bg-green-50 text-green-600',
  Decommissioned: 'bg-red-50 text-red-600',
  Retired: 'bg-gray-50 text-gray-500',
};

export function CardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch impact analysis for this card
  const { data: impactAnalysis } = useImpactAnalysis(id || '');

  // Relationship creation form state
  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const [availableCards, setAvailableCards] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [relationshipType, setRelationshipType] = useState<'depends_on' | 'implements' | 'similar_to' | 'conflicts_with'>('depends_on');
  const [savingRelationship, setSavingRelationship] = useState(false);
  const [relationshipError, setRelationshipError] = useState<string | null>(null);

  // Fetch available cards when add relationship form is shown
  useEffect(() => {
    if (showAddRelationship && id) {
      relationshipApi.getAvailableCards(id).then(setAvailableCards).catch(console.error);
    }
  }, [showAddRelationship, id]);

  // Handle relationship creation
  const handleCreateRelationship = async () => {
    if (!id || !selectedCardId) return;

    setSavingRelationship(true);
    setRelationshipError(null);

    try {
      await relationshipApi.create({
        fromCardId: id,
        toCardId: selectedCardId,
        relationshipType,
      });

      // Refresh the page data
      window.location.reload();
    } catch (err) {
      setRelationshipError('Failed to create relationship');
      console.error(err);
    } finally {
      setSavingRelationship(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    const fetchCard = async () => {
      setLoading(true);
      try {
        const data = await cardApi.get(id);
        setCard(data);
      } catch (err) {
        setError('Failed to load card');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCard();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !card) {
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
        <p className="mt-1 text-sm text-gray-500">{error || 'Card not found'}</p>
        <button
          onClick={() => navigate('/cards')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Back to Cards
        </button>
      </div>
    );
  }

  const typeColor = cardTypeColors[card.type] || 'bg-gray-100 text-gray-800';
  const phaseColor = lifecyclePhaseColors[card.lifecyclePhase] || 'bg-gray-100 text-gray-600';

  return (
    <div data-testid="card-detail">
      <button
        data-testid="card-detail-back-button"
        onClick={() => navigate('/cards')}
        className="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Cards
      </button>

      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-3" data-testid="card-name">{card.name}</h1>
            <div className="flex items-center gap-3">
              <button
                data-testid="edit-card-button"
                onClick={() => navigate(`/cards/${card.id}/edit`)}
                className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
              >
                Edit
              </button>
              <button
                data-testid="delete-card-button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this card?')) {
                    cardApi.delete(card.id).then(() => navigate('/cards'));
                  }
                }}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
              >
                Delete
              </button>
              <button
                data-testid="card-detail-intelligence-button"
                onClick={() => navigate(`/cards/${card.id}/intelligence`)}
                className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-400 text-white text-sm rounded-md hover:shadow-lg hover:shadow-amber-500/20 font-medium"
              >
                Intelligence
              </button>
              <button
                data-testid="request-arb-btn"
                onClick={() => navigate(`/arb/requests/new?cardId=${card.id}`)}
                className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm rounded-md hover:shadow-lg hover:shadow-indigo-500/20 font-medium"
              >
                Request ARB Review
              </button>
              <button
                data-testid="add-relationship-btn"
                onClick={() => setShowAddRelationship(!showAddRelationship)}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
              >
                {showAddRelationship ? 'Cancel' : 'Add Relationship'}
              </button>
              <span className={`px-3 py-1 rounded-md text-sm font-medium ${typeColor}`} data-testid="card-type">
                {card.type}
              </span>
              <span className={`px-3 py-1 rounded-md text-sm font-medium ${phaseColor}`}>
                {card.lifecyclePhase}
              </span>
              {card.qualityScore !== undefined && (
                <div className="flex items-center">
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        card.qualityScore >= 80 ? 'bg-green-500' :
                        card.qualityScore >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${card.qualityScore}%` }}
                    />
                  </div>
                  <span className="ml-2 text-sm text-gray-600">{card.qualityScore}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {card.description && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
              Description
            </h2>
            <p className="text-gray-700" data-testid="card-description">{card.description}</p>
          </div>
        )}

        {card.tags && card.tags.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {card.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Created:</span>{' '}
              <span className="text-gray-900">
                {new Date(card.createdAt).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Updated:</span>{' '}
              <span className="text-gray-900">
                {new Date(card.updatedAt).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>{' '}
              <span className="capitalize text-gray-900">{card.status}</span>
            </div>
            <div>
              <span className="text-gray-500">ID:</span>{' '}
              <span className="text-gray-900 font-mono text-xs">{card.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Relationship Creation Form */}
      {showAddRelationship && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6 border border-gray-200" data-testid="add-relationship-form">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Relationship</h2>

          {relationshipError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md" data-testid="relationship-error">
              <p className="text-sm text-red-600">{relationshipError}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Related Card Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Related Card
              </label>
              <select
                data-testid="related-card-select"
                value={selectedCardId}
                onChange={(e) => setSelectedCardId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={savingRelationship}
              >
                <option value="">Select a card...</option>
                {availableCards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Relationship Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relationship Type
              </label>
              <select
                data-testid="relationship-type-select"
                value={relationshipType}
                onChange={(e) => setRelationshipType(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={savingRelationship}
              >
                <option value="depends_on">Depends On</option>
                <option value="implements">Implements</option>
                <option value="similar_to">Similar To</option>
                <option value="conflicts_with">Conflicts With</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                data-testid="save-relationship-btn"
                onClick={handleCreateRelationship}
                disabled={!selectedCardId || savingRelationship}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {savingRelationship ? 'Saving...' : 'Save Relationship'}
              </button>
              <button
                onClick={() => setShowAddRelationship(false)}
                disabled={savingRelationship}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dependencies Section */}
      {(impactAnalysis?.upstream.length || impactAnalysis?.downstream.length) && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6 border border-gray-200" data-testid="dependencies-section">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dependencies</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upstream Dependencies */}
            {impactAnalysis?.upstream.length ? (
              <div data-testid="upstream-dependencies">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  Upstream Dependencies ({impactAnalysis.upstream.length})
                </h3>
                <div className="text-sm text-gray-600">
                  This card depends on {impactAnalysis.upstream.length} other card(s)
                </div>
              </div>
            ) : null}

            {/* Downstream Dependencies */}
            {impactAnalysis?.downstream.length ? (
              <div data-testid="downstream-dependencies">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  Downstream Dependents ({impactAnalysis.downstream.length})
                </h3>
                <div className="text-sm text-gray-600">
                  {impactAnalysis.downstream.length} other card(s) depend on this card
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
