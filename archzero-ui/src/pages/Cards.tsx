import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Card, CardTypeValue, LifecyclePhaseValue } from '@/types/api';
import { CardList } from '../components/cards';
import { BulkActionsToolbar } from '../components/bulk/BulkActionsToolbar';
import { cardApi } from '@/lib/cards';

export function CardsPage() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<CardTypeValue | undefined>();
  const [selectedPhase, setSelectedPhase] = useState<LifecyclePhaseValue | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [allCardIds, setAllCardIds] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleCardClick = (card: Card) => {
    navigate(`/cards/${card.id}`);
  };

  const handleToggleSelect = (cardId: string) => {
    const newSelected = new Set(selectedCardIds);
    if (newSelected.has(cardId)) {
      newSelected.delete(cardId);
    } else {
      newSelected.add(cardId);
    }
    setSelectedCardIds(newSelected);
  };

  const handleSelectAll = () => {
    // If all are selected, deselect all. Otherwise, select all.
    if (selectedCardIds.size === allCardIds.length && allCardIds.length > 0) {
      setSelectedCardIds(new Set());
    } else {
      setSelectedCardIds(new Set(allCardIds));
    }
  };

  const handleClearSelection = () => {
    setSelectedCardIds(new Set());
  };

  const handleBulkDelete = async () => {
    // Show confirmation modal
    setShowDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    setShowDeleteModal(false);

    try {
      // Delete each selected card
      for (const cardId of selectedCardIds) {
        await cardApi.delete(cardId);
      }
      // Clear selection after successful delete
      handleClearSelection();
      // Show success toast
      setShowSuccessToast(true);
      // Hide toast and refresh after showing it for a while
      setTimeout(() => {
        setShowSuccessToast(false);
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error('Failed to delete cards:', error);
      alert('Failed to delete one or more cards. Please try again.');
    }
  };

  const handleBulkEdit = () => {
    // Placeholder for bulk edit functionality
    console.log('Bulk edit not yet implemented');
  };

  const handleBulkTag = () => {
    // Placeholder for bulk tag functionality
    console.log('Bulk tag not yet implemented');
  };

  const handleBulkExport = () => {
    // Placeholder for bulk export functionality
    console.log('Bulk export not yet implemented');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Cards</h1>
          <button
            data-testid="new-card-button"
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
              data-testid="filter-search"
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            data-testid="filter-type"
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
            data-testid="filter-lifecycle"
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

      <BulkActionsToolbar
        selectedCount={selectedCardIds.size}
        onBulkDelete={handleBulkDelete}
        onBulkEdit={handleBulkEdit}
        onBulkTag={handleBulkTag}
        onBulkExport={handleBulkExport}
        onClearSelection={handleClearSelection}
      />

      <div className="mb-4 flex items-center gap-2">
        <input
          data-testid="select-all-cards"
          id="select-all-cards"
          type="checkbox"
          checked={selectedCardIds.size > 0 && selectedCardIds.size === allCardIds.length}
          onChange={handleSelectAll}
          className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
        />
        <label htmlFor="select-all-cards" className="text-sm text-gray-700 cursor-pointer">
          Select All (Visible)
        </label>
      </div>

      <CardList
        cardTypeFilter={selectedType}
        lifecyclePhaseFilter={selectedPhase}
        searchQuery={searchQuery}
        onCardClick={handleCardClick}
        selectedCardIds={selectedCardIds}
        onToggleSelect={handleToggleSelect}
        showCheckboxes={true}
        onCardIdsLoaded={setAllCardIds}
      />

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm Delete
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete {selectedCardIds.size} selected card(s)? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                data-testid="confirm-delete"
                onClick={confirmBulkDelete}
                className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div
          data-testid="toast-success"
          className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Cards deleted successfully
        </div>
      )}
    </div>
  );
}
