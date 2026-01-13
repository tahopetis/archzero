import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BIAAssessmentForm } from '@/components/intelligence/BIAAssessmentForm';
import { MigrationRecommendations } from '@/components/intelligence/MigrationRecommendations';
import { TCOVisualization } from '@/components/intelligence/TCOVisualization';
import { ComparisonViews } from '@/components/intelligence/ComparisonViews';
import { ArrowLeft, FileText, GitCompare, DollarSign, BarChart3, TrendingUp } from 'lucide-react';

type TabType = 'bia' | 'migration' | 'tco' | 'comparison';

const tabs = [
  { id: 'bia' as TabType, label: 'BIA Assessment', icon: FileText },
  { id: 'migration' as TabType, label: 'Migration Strategy', icon: GitCompare },
  { id: 'tco' as TabType, label: 'TCO Analysis', icon: DollarSign },
  { id: 'comparison' as TabType, label: 'Comparison', icon: TrendingUp },
];

export function IntelligencePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('bia');
  const [showBIAForm, setShowBIAForm] = useState(false);

  if (!id) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Card ID not found</div>
      </div>
    );
  }

  if (showBIAForm) {
    return (
      <BIAAssessmentForm
        cardId={id}
        cardName="Application Card" // Would fetch from API
        profiles={['healthcare', 'financial', 'manufacturing']}
        onSubmit={(assessment) => {
          console.log('BIA Assessment submitted:', assessment);
          setShowBIAForm(false);
        }}
        onCancel={() => setShowBIAForm(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/cards"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Cards</span>
            </Link>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm">
                Export Report
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900 rounded-lg hover:shadow-lg hover:shadow-amber-500/20 transition-all text-sm font-medium">
                Save All
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold text-white">Intelligence Analysis</h1>
            <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg text-sm font-mono">
              {id.slice(0, 8)}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'bia' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Business Impact Analysis</h2>
                <p className="text-slate-400">Assess criticality and business impact using industry-specific profiles</p>
              </div>
              <button
                onClick={() => setShowBIAForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900 rounded-xl hover:shadow-lg hover:shadow-amber-500/20 transition-all font-medium"
              >
                Start New Assessment
              </button>
            </div>

            {/* BIA Results Placeholder */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-12 text-center">
              <FileText className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Assessment Yet</h3>
              <p className="text-slate-400 mb-6">Start a BIA assessment to evaluate this application's business impact</p>
              <button
                onClick={() => setShowBIAForm(true)}
                className="px-6 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Create Assessment
              </button>
            </div>
          </div>
        )}

        {activeTab === 'migration' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Migration Strategy</h2>
              <p className="text-slate-400">6R migration recommendations based on application characteristics</p>
            </div>
            <MigrationRecommendations cardId={id} />
          </div>
        )}

        {activeTab === 'tco' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Total Cost of Ownership</h2>
              <p className="text-slate-400">Comprehensive cost breakdown with allocation analysis</p>
            </div>
            <TCOVisualization cardId={id} />
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">What-If Analysis</h2>
              <p className="text-slate-400">Compare different migration scenarios and their financial impact</p>
            </div>
            <ComparisonViews cardId={id} />
          </div>
        )}
      </div>
    </div>
  );
}
