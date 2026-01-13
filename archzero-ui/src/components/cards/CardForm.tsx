import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Card, CreateCardRequest } from '@/types/api';
import { CardType, LifecyclePhase } from '@/types/api';
import { cardApi } from '@/lib/cards';

interface CardFormProps {
  mode?: 'create' | 'edit';
}

export function CardForm({ mode = 'create' }: CardFormProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CreateCardRequest>({
    name: '',
    type: 'Application',
    lifecyclePhase: 'Discovery',
    description: '',
    qualityScore: undefined,
    tags: [],
    attributes: {},
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  // Load existing card data if in edit mode
  useEffect(() => {
    if (mode === 'edit' && id) {
      const fetchCard = async () => {
        setLoading(true);
        try {
          const card: Card = await cardApi.get(id);
          setFormData({
            name: card.name,
            type: card.type,
            lifecyclePhase: card.lifecyclePhase,
            description: card.description || '',
            qualityScore: card.qualityScore,
            tags: card.tags || [],
            attributes: card.attributes || {},
          });
        } catch (err) {
          setError('Failed to load card');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchCard();
    }
  }, [mode, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'create') {
        await cardApi.create(formData);
      } else if (id) {
        await cardApi.update(id, formData);
      }
      navigate('/cards');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save card');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: CreateCardRequest) => ({
      ...prev,
      [name]: name === 'qualityScore' ? (value ? Number(value) : undefined) : value,
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData((prev: CreateCardRequest) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev: CreateCardRequest) => ({
      ...prev,
      tags: prev.tags?.filter((tag: string) => tag !== tagToRemove) || [],
    }));
  };

  if (loading && mode === 'edit') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4">
        <button
          onClick={() => navigate('/cards')}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Cards
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {mode === 'create' ? 'Create New Card' : 'Edit Card'}
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {Object.entries(CardType).map(([key, value]) => (
                  <option key={key} value={value}>{key}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="lifecyclePhase" className="block text-sm font-medium text-gray-700 mb-1">
                Lifecycle Phase *
              </label>
              <select
                id="lifecyclePhase"
                name="lifecyclePhase"
                value={formData.lifecyclePhase}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {Object.entries(LifecyclePhase).map(([key, value]) => (
                  <option key={key} value={value}>{key}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="qualityScore" className="block text-sm font-medium text-gray-700 mb-1">
              Quality Score (0-100)
            </label>
            <input
              type="number"
              id="qualityScore"
              name="qualityScore"
              value={formData.qualityScore ?? ''}
              onChange={handleChange}
              min={0}
              max={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Type and press Enter"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Add
              </button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-indigo-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/cards')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Card' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
