import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, TrendingUp, TrendingDown, Minus, Info, BarChart3, DollarSign, AlertTriangle } from 'lucide-react';

interface ComparisonViewsProps {
  cardId: string;
}

interface Scenario {
  id: string;
  name: string;
  recommendation: string;
  annualTCO: number;
  oneTimeCost: number;
  effort: string;
  risk: string;
  timeline: string;
}

export function ComparisonViews({ cardId }: ComparisonViewsProps) {
  const [loading, setLoading] = useState(true);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'tabbed'>('side-by-side');
  const [timeHorizon, setTimeHorizon] = useState<number>(3); // years

  useEffect(() => {
    // Fetch comparison data from API
    setTimeout(() => {
      setScenarios([
        {
          id: 'rehost',
          name: 'Rehost (Lift & Shift)',
          recommendation: 'Rehost',
          annualTCO: 850000,
          oneTimeCost: 75000,
          effort: 'Medium',
          risk: 'Low',
          timeline: '3-6 months',
        },
        {
          id: 'replatform',
          name: 'Replatform (Cloud-Native)',
          recommendation: 'Replatform',
          annualTCO: 650000,
          oneTimeCost: 275000,
          effort: 'VeryHigh',
          risk: 'Medium',
          timeline: '12-18 months',
        },
        {
          id: 'replace',
          name: 'Replace (SaaS)',
          recommendation: 'Replace',
          annualTCO: 550000,
          oneTimeCost: 150000,
          effort: 'Medium',
          risk: 'High',
          timeline: '6-12 months',
        },
        {
          id: 'retain',
          name: 'Retain (Status Quo)',
          recommendation: 'Retain',
          annualTCO: 995000,
          oneTimeCost: 25000,
          effort: 'Low',
          risk: 'VeryHigh',
          timeline: '0 months',
        },
      ]);
      setSelectedScenarios(['rehost', 'replatform']);
      setLoading(false);
    }, 1000);
  }, [cardId]);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-1/4"></div>
          <div className="h-64 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  const selectedScenarioData = scenarios.filter(s => selectedScenarios.includes(s.id));
  const baselineScenario = scenarios.find(s => s.recommendation === 'Retain') || scenarios[0];

  const calculateROI = (scenario: Scenario) => {
    const baselineTotal = (baselineScenario.annualTCO * timeHorizon) + baselineScenario.oneTimeCost;
    const scenarioTotal = (scenario.annualTCO * timeHorizon) + scenario.oneTimeCost;
    return ((baselineTotal - scenarioTotal) / baselineTotal) * 100;
  };

  const effortColors = {
    None: 'bg-slate-500',
    Low: 'bg-emerald-500',
    Medium: 'bg-yellow-500',
    High: 'bg-orange-500',
    VeryHigh: 'bg-red-500',
  };

  const riskColors = {
    VeryLow: 'bg-emerald-500',
    Low: 'bg-teal-500',
    Medium: 'bg-yellow-500',
    High: 'bg-orange-500',
    VeryHigh: 'bg-red-500',
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Info className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Comparison Settings</h3>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'side-by-side'
                  ? 'bg-amber-500 text-slate-900'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Side by Side
            </button>
            <button
              onClick={() => setViewMode('tabbed')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'tabbed'
                  ? 'bg-amber-500 text-slate-900'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Tabbed View
            </button>
          </div>
        </div>

        {/* Scenario Selection */}
        <div className="mb-6">
          <label className="text-sm text-slate-400 mb-3 block">Select Scenarios to Compare (2-4)</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {scenarios.map(scenario => (
              <button
                key={scenario.id}
                onClick={() => {
                  if (selectedScenarios.includes(scenario.id)) {
                    if (selectedScenarios.length > 2) {
                      setSelectedScenarios(prev => prev.filter(id => id !== scenario.id));
                    }
                  } else if (selectedScenarios.length < 4) {
                    setSelectedScenarios(prev => [...prev, scenario.id]);
                  }
                }}
                disabled={!selectedScenarios.includes(scenario.id) && selectedScenarios.length >= 4}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedScenarios.includes(scenario.id)
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                } ${!selectedScenarios.includes(scenario.id) && selectedScenarios.length >= 4 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="font-medium text-white mb-1">{scenario.name}</div>
                <div className="text-xs text-slate-400">${(scenario.annualTCO / 1000).toFixed(0)}K/yr</div>
              </button>
            ))}
          </div>
        </div>

        {/* Time Horizon Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-400">Time Horizon</label>
            <div className="text-lg font-bold text-white">{timeHorizon} Years</div>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={timeHorizon}
            onChange={(e) => setTimeHorizon(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>1 year</span>
            <span>5 years</span>
            <span>10 years</span>
          </div>
        </div>
      </div>

      {/* Comparison View */}
      {viewMode === 'side-by-side' ? (
        <div className="grid grid-cols-2 gap-6">
          {selectedScenarioData.map(scenario => {
            const roi = calculateROI(scenario);
            const totalCost = (scenario.annualTCO * timeHorizon) + scenario.oneTimeCost;

            return (
              <div key={scenario.id} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                {/* Header */}
                <div className={`px-6 py-4 border-b border-slate-700 ${
                  scenario.recommendation === 'Retain' ? 'bg-slate-800' : 'bg-gradient-to-r from-amber-500/10 to-cyan-500/10'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-white">{scenario.name}</h3>
                    <ROIIndicator roi={roi} />
                  </div>
                  <div className="text-sm text-slate-400">{scenario.timeline}</div>
                </div>

                {/* Metrics */}
                <div className="p-6 space-y-4">
                  {/* Total Cost */}
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">Total {timeHorizon}-Year Cost</div>
                    <div className="text-2xl font-bold text-white">${(totalCost / 1000).toFixed(0)}K</div>
                    <div className="text-xs text-slate-500 mt-1">
                      ${(scenario.oneTimeCost / 1000).toFixed(0)}K one-time + ${(scenario.annualTCO / 1000).toFixed(0)}K/yr
                    </div>
                  </div>

                  {/* Cost Breakdown Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">One-time vs Recurring</span>
                      <span className="text-white font-medium">
                        {((scenario.oneTimeCost / totalCost) * 100).toFixed(0)}% / {((scenario.annualTCO * timeHorizon / totalCost) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden flex">
                      <div
                        className="bg-amber-500 h-full"
                        style={{ width: `${(scenario.oneTimeCost / totalCost) * 100}%` }}
                      />
                      <div
                        className="bg-cyan-500 h-full"
                        style={{ width: `${(scenario.annualTCO * timeHorizon / totalCost) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Effort & Risk */}
                  <div className="grid grid-cols-2 gap-3">
                    <MetricBadge label="Effort" value={scenario.effort} colorClass={effortColors[scenario.effort as keyof typeof effortColors]} />
                    <MetricBadge label="Risk" value={scenario.risk} colorClass={riskColors[scenario.risk as keyof typeof riskColors]} />
                  </div>

                  {/* Annual Cost Trend */}
                  <div className="pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Annual Cost</span>
                      <span className="text-white font-medium">${(scenario.annualTCO / 1000).toFixed(0)}K/year</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-700">
            {selectedScenarioData.map((scenario, index) => (
              <button
                key={scenario.id}
                onClick={() => setSelectedScenarios([scenario.id, selectedScenarios.find(id => id !== scenario.id) || selectedScenarios[1]])}
                className={`flex-1 px-6 py-4 text-left transition-all ${
                  index === 0 ? 'bg-amber-500/10 border-l-4 border-amber-500' : 'bg-slate-800/50 hover:bg-slate-800'
                }`}
              >
                <div className="font-semibold text-white mb-1">{scenario.name}</div>
                <div className="text-sm text-slate-400">${(scenario.annualTCO / 1000).toFixed(0)}K/yr</div>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {selectedScenarioData.slice(0, 2).map(scenario => {
              const roi = calculateROI(scenario);
              const totalCost = (scenario.annualTCO * timeHorizon) + scenario.oneTimeCost;

              return (
                <div key={scenario.id} className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">{scenario.name}</h3>
                      <div className="flex items-center gap-3">
                        <MetricBadge label="Effort" value={scenario.effort} colorClass={effortColors[scenario.effort as keyof typeof effortColors]} />
                        <MetricBadge label="Risk" value={scenario.risk} colorClass={riskColors[scenario.risk as keyof typeof riskColors]} />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-400 mb-1">{timeHorizon}-Year Total</div>
                      <div className="text-3xl font-bold text-white">${(totalCost / 1000).toFixed(0)}K</div>
                    </div>
                  </div>

                  {/* Detailed Cost Breakdown */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-amber-400" />
                        <span className="text-sm text-slate-400">One-Time Costs</span>
                      </div>
                      <div className="text-2xl font-bold text-white">${(scenario.oneTimeCost / 1000).toFixed(0)}K</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm text-slate-400">Annual Costs</span>
                      </div>
                      <div className="text-2xl font-bold text-white">${(scenario.annualTCO / 1000).toFixed(0)}K</div>
                    </div>
                  </div>

                  {/* Year-over-Year Breakdown */}
                  <div className="bg-slate-800/30 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-3">Year-over-Year Cost Breakdown</div>
                    <div className="space-y-2">
                      {Array.from({ length: Math.min(timeHorizon, 5) }, (_, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-white">Year {i + 1}</span>
                          <span className="text-white font-medium">
                            ${(((scenario.annualTCO * (i + 1)) + (i === 0 ? scenario.oneTimeCost : 0)) / 1000).toFixed(0)}K
                            {i === 0 && <span className="text-xs text-amber-400 ml-2">(incl. one-time)</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparison Summary Table */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            Summary Comparison
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Metric</th>
                {selectedScenarioData.map(scenario => (
                  <th key={scenario.id} className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                    {scenario.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr>
                <td className="px-6 py-4 text-sm text-slate-400">Annual TCO</td>
                {selectedScenarioData.map(scenario => (
                  <td key={scenario.id} className="px-6 py-4 text-right text-sm font-medium text-white">
                    ${(scenario.annualTCO / 1000).toFixed(0)}K
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-slate-400">One-Time Cost</td>
                {selectedScenarioData.map(scenario => (
                  <td key={scenario.id} className="px-6 py-4 text-right text-sm font-medium text-white">
                    ${(scenario.oneTimeCost / 1000).toFixed(0)}K
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-slate-400">{timeHorizon}-Year Total</td>
                {selectedScenarioData.map(scenario => {
                  const total = (scenario.annualTCO * timeHorizon) + scenario.oneTimeCost;
                  return (
                    <td key={scenario.id} className="px-6 py-4 text-right text-sm font-bold text-white">
                      ${(total / 1000).toFixed(0)}K
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-slate-400">ROI vs Baseline</td>
                {selectedScenarioData.map(scenario => {
                  const roi = calculateROI(scenario);
                  return (
                    <td key={scenario.id} className="px-6 py-4 text-right">
                      <ROIIndicator roi={roi} compact />
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-slate-400">Effort Level</td>
                {selectedScenarioData.map(scenario => (
                  <td key={scenario.id} className="px-6 py-4 text-right">
                    <MetricBadge value={scenario.effort} colorClass={effortColors[scenario.effort as keyof typeof effortColors]} />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-slate-400">Risk Level</td>
                {selectedScenarioData.map(scenario => (
                  <td key={scenario.id} className="px-6 py-4 text-right">
                    <MetricBadge value={scenario.risk} colorClass={riskColors[scenario.risk as keyof typeof riskColors]} />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ROIIndicator({ roi, compact = false }: { roi: number; compact?: boolean }) {
  const isPositive = roi > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;

  if (compact) {
    return (
      <div className={`flex items-center justify-end gap-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
        <Icon className="w-3 h-3" />
        <span className="text-sm font-medium">{roi > 0 ? '+' : ''}{roi.toFixed(1)}%</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
      isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
    }`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-bold">{roi > 0 ? '+' : ''}{roi.toFixed(1)}% ROI</span>
    </div>
  );
}

function MetricBadge({ label, value, colorClass }: { label?: string; value: string; colorClass: string }) {
  return (
    <div className={`px-3 py-1.5 rounded-lg ${colorClass} bg-opacity-10 border ${colorClass.replace('bg-', 'border-')} border-opacity-30`}>
      {label && <div className="text-xs text-slate-400 mb-0.5">{label}</div>}
      <div className={`text-sm font-semibold ${colorClass.replace('bg-', 'text-')}`}>{value}</div>
    </div>
  );
}
