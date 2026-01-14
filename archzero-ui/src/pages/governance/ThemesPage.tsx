import { useState } from 'react';
import { Plus, Edit, Trash2, Tag as TagIcon } from 'lucide-react';

interface Theme {
  id: string;
  name: string;
  description: string;
  color: string;
  initiativesCount: number;
}

export function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([
    // Mock data - replace with API call
    {
      id: '1',
      name: 'Cloud Native',
      description: 'Initiatives related to cloud-native architecture and migration',
      color: '#3b82f6',
      initiativesCount: 5,
    },
    {
      id: '2',
      name: 'Security First',
      description: 'Security-focused initiatives and compliance requirements',
      color: '#ef4444',
      initiativesCount: 3,
    },
    {
      id: '3',
      name: 'Cost Optimization',
      description: 'Initiatives focused on reducing operational costs',
      color: '#10b981',
      initiativesCount: 2,
    },
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" data-testid="themes-page-title">
          Strategic Themes
        </h1>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          data-testid="add-theme-btn"
        >
          <Plus size={20} />
          Add Theme
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4"
            style={{ borderLeftColor: theme.color }}
            data-testid={`theme-item-${theme.id}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <TagIcon size={20} style={{ color: theme.color }} />
                <h3 className="text-xl font-semibold" data-testid={`theme-name-${theme.id}`}>
                  {theme.name}
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingTheme(theme)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  data-testid={`edit-theme-${theme.id}`}
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this theme?')) {
                      setThemes(themes.filter((t) => t.id !== theme.id));
                    }
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-600"
                  data-testid={`delete-theme-${theme.id}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-3" data-testid={`theme-description-${theme.id}`}>
              {theme.description}
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-500" data-testid={`theme-initiatives-${theme.id}`}>
              {theme.initiativesCount} initiatives
            </div>
          </div>
        ))}
      </div>

      {isCreating && (
        <ThemeForm
          onClose={() => setIsCreating(false)}
          onSave={(newTheme) => {
            setThemes([...themes, { ...newTheme, id: Date.now().toString(), initiativesCount: 0 }]);
            setIsCreating(false);
          }}
        />
      )}

      {editingTheme && (
        <ThemeForm
          theme={editingTheme}
          onClose={() => setEditingTheme(null)}
          onSave={(updatedTheme) => {
            setThemes(themes.map((t) => (t.id === editingTheme.id ? { ...t, ...updatedTheme } : t)));
            setEditingTheme(null);
          }}
        />
      )}
    </div>
  );
}

interface ThemeFormProps {
  theme?: Theme;
  onClose: () => void;
  onSave: (theme: Omit<Theme, 'id' | 'initiativesCount'>) => void;
}

function ThemeForm({ theme, onClose, onSave }: ThemeFormProps) {
  const [name, setName] = useState(theme?.name || '');
  const [description, setDescription] = useState(theme?.description || '');
  const [color, setColor] = useState(theme?.color || '#3b82f6');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description, color });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="theme-form-modal">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{theme ? 'Edit Theme' : 'Create Theme'}</h2>
        <form onSubmit={handleSubmit} data-testid="theme-form">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="theme-name-input"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="theme-description-input"
              rows={3}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              data-testid="theme-color-input"
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              data-testid="cancel-theme-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              data-testid="save-theme-btn"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
