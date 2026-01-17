/**
 * ARB Template Library Component
 * Displays and manages ARB templates for reusing submission data
 */

import { useState } from 'react';
import { useTemplates, useDeleteTemplate } from '@/services/arbTemplateService';
import { Copy, Trash2, FileText, Plus, Search } from 'lucide-react';
import { Card } from '../shared';
import type { ARBTemplate } from '@/services/arbTemplateService';

export function TemplateLibrary() {
  const { data: templates, isLoading } = useTemplates();
  const deleteTemplate = useDeleteTemplate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const filteredTemplates = templates?.filter(template =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete the template "${title}"?`)) {
      try {
        await deleteTemplate.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete template:', error);
        alert('Failed to delete template. Please try again.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse bg-slate-100 h-96 rounded-xl" data-testid="template-library-loading" />
    );
  }

  return (
    <div className="space-y-6" data-testid="template-library">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ARB Templates</h1>
          <p className="text-slate-600 mt-1">Save and reuse ARB submission templates</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          data-testid="template-search"
        />
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">No templates found</p>
          <p className="text-sm text-slate-500 mt-1">
            {searchQuery ? 'Try a different search term' : 'Save a submission as a template to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="p-4 hover:shadow-md transition-shadow"
              data-testid={`template-${template.id}`}
            >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">{template.title}</h3>
                    <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                      {template.request_type}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(template.id, template.title)}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    data-testid={`delete-template-btn-${template.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {template.description && (
                  <p className="text-sm text-slate-600 line-clamp-2">{template.description}</p>
                )}
                <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
                  Created: {new Date(template.created_at).toLocaleDateString()}
                </div>
              </Card>
          ))}
        </div>
      )}
    </div>
  );
}
