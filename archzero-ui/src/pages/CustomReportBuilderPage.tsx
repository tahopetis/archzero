import { useState } from 'react';
import { Plus, Trash2, Eye, Save, FileText, BarChart3, PieChart, Calendar, Users, DollarSign } from 'lucide-react';

interface ReportSection {
  id: string;
  type: 'title' | 'chart' | 'table' | 'text' | 'metrics';
  title: string;
}

const availableSections = [
  { id: 'exec-summary', type: 'title', title: 'Executive Summary', icon: FileText },
  { id: 'overview-chart', type: 'chart', title: 'Overview Chart', icon: BarChart3 },
  { id: 'distribution', type: 'chart', title: 'Distribution Pie', icon: PieChart },
  { id: 'timeline', type: 'chart', title: 'Timeline View', icon: Calendar },
  { id: 'team-metrics', type: 'metrics', title: 'Team Metrics', icon: Users },
  { id: 'financial-summary', type: 'metrics', title: 'Financial Summary', icon: DollarSign },
  { id: 'data-table', type: 'table', title: 'Data Table', icon: FileText },
  { id: 'notes', type: 'text', title: 'Notes Section', icon: FileText },
];

export function CustomReportBuilderPage() {
  const [reportSections, setReportSections] = useState<ReportSection[]>([
    { id: 's1', type: 'title', title: 'Executive Summary' },
    { id: 's2', type: 'metrics', title: 'Key Metrics' },
  ]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const addSection = (sectionTemplate: typeof availableSections[0]) => {
    const newSection: ReportSection = {
      id: "s" + Date.now(),
      type: sectionTemplate.type as any,
      title: sectionTemplate.title,
    };
    setReportSections([...reportSections, newSection]);
  };

  const removeSection = (sectionId: string) => {
    setReportSections(reportSections.filter(s => s.id !== sectionId));
  };

  const updateSectionTitle = (sectionId: string, newTitle: string) => {
    setReportSections(reportSections.map(s =>
      s.id === sectionId ? { ...s, title: newTitle } : s
    ));
  };

  const saveTemplate = () => {
    console.log('Saving template:', templateName);
    setShowTemplateModal(false);
    setTemplateName('');
    // Show success message
    setTimeout(() => {
      alert('Template saved');
    }, 100);
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'title': return FileText;
      case 'chart': return BarChart3;
      case 'table': return FileText;
      case 'metrics': return BarChart3;
      case 'text': return FileText;
      default: return FileText;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold" data-testid="report-builder-page">Custom Report Builder</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Design and create custom reports by dragging and dropping sections
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sections Palette */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6" data-testid="sections-palette">
          <h2 className="text-lg font-semibold mb-4">Available Sections</h2>
          <div className="space-y-2 report-sections">
            {availableSections.map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.id}
                  data-testid="section-item"
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => addSection(section)}
                >
                  <Icon size={20} className="text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium">{section.title}</span>
                  <Plus size={16} className="ml-auto text-blue-600" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Canvas / Drop Zone */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6" data-testid="report-canvas">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Report Canvas</h2>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              data-testid="save-template-btn"
            >
              <Save size={18} />
              Save Template
            </button>
          </div>

          <div className="min-h-[500px] p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg drop-zone">
            {reportSections.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <FileText size={48} className="mx-auto mb-4" />
                  <p>Drag sections here or click to add</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {reportSections.map((section, index) => {
                  const Icon = getSectionIcon(section.type);
                  return (
                    <div
                      key={section.id}
                      data-testid="canvas-section"
                      className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 report-section"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Icon size={20} className="text-gray-600 dark:text-gray-400" />
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          data-testid="section-title-input"
                        />
                        <button
                          onClick={() => removeSection(section.id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {/* Section Preview */}
                      {section.type === 'title' && (
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                          <h3 className="text-2xl font-bold">{section.title}</h3>
                        </div>
                      )}

                      {section.type === 'chart' && (
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="h-32 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg flex items-center justify-center">
                            <BarChart3 className="text-gray-400" size={48} />
                          </div>
                        </div>
                      )}

                      {section.type === 'metrics' && (
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">85%</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Metric 1</div>
                            </div>
                            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">92%</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Metric 2</div>
                            </div>
                            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                              <div className="text-2xl font-bold text-purple-600">78%</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Metric 3</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {section.type === 'table' && (
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2">Item</th>
                                <th className="text-left p-2">Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b">
                                <td className="p-2">Row 1</td>
                                <td className="p-2">Data 1</td>
                              </tr>
                              <tr>
                                <td className="p-2">Row 2</td>
                                <td className="p-2">Data 2</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      {section.type === 'text' && (
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                          <p className="text-gray-600 dark:text-gray-400">Add your custom notes here...</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Live Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6" data-testid="live-preview">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Eye size={20} />
            Live Preview
          </h2>
          <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg report-preview">
            <div className="text-center text-gray-400 text-sm">
              Report preview will appear here
            </div>
            {reportSections.map((section) => (
              <div key={section.id} className="mb-4">
                <h3 className="text-lg font-bold mb-2">{section.title}</h3>
                <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Save Report Template</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Template Name</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                data-testid="template-name"
                placeholder="e.g., Executive Summary Report"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={saveTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                data-testid="confirm-save-btn"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
