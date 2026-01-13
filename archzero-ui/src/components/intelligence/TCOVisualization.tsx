import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, PieChart, BarChart3, ChevronDown, ChevronRight } from 'lucide-react';

interface TCOVisualizationProps {
  cardId: string;
}

interface CostBreakdown {
  hardware: number;
  software: number;
  personnel: number;
  facilities: number;
  support: number;
  training: number;
  licensing: number;
  cloudCosts: number;
  migrationCosts: number;
  retirementCosts: number;
  riskMitigation: number;
  contingency: number;
}

export function TCOVisualization({ cardId }: TCOVisualizationProps) {
  const [loading, setLoading] = useState(true);
  const [tco, setTCO] = useState<any>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    // Fetch TCO data from API
    setTimeout(() => {
      setTCO({
        id: '1',
        cardId,
        cardName: 'Claims Processing System',
        costBreakdown: {
          hardware: 120000,
          software: 85000,
          personnel: 350000,
          facilities: 45000,
          support: 65000,
          training: 25000,
          licensing: 55000,
          cloudCosts: 95000,
          migrationCosts: 75000,
          retirementCosts: 0,
          riskMitigation: 0,
          contingency: 15000,
        },
        totalTCO: 995000,
        monthlyTCO: 82917,
        annualTCO: 995000,
        currency: 'USD',
        calculationPeriodMonths: 12,
        calculatedAt: new Date().toISOString(),
      });
      setLoading(false);
    }, 1000);
  }, [cardId]);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-1/4"></div>
          <div className="h-48 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!tco) return null;

  const costs = tco.costBreakdown;
  const categoryColors: Record<string, string> = {
    hardware: 'bg-blue-500',
    software: 'bg-purple-500',
    personnel: 'bg-pink-500',
    facilities: 'bg-orange-500',
    support: 'bg-yellow-500',
    training: 'bg-green-500',
    licensing: 'bg-teal-500',
    cloudCosts: 'bg-cyan-500',
    migrationCosts: 'bg-indigo-500',
    retirementCosts: 'bg-red-500',
    riskMitigation: 'bg-rose-500',
    contingency: 'bg-amber-500',
  };

  const categoryLabels: Record<string, string> = {
    hardware: 'Hardware',
    software: 'Software',
    personnel: 'Personnel',
    facilities: 'Facilities',
    support: 'Support',
    training: 'Training',
    licensing: 'Licensing',
    cloudCosts: 'Cloud Costs',
    migrationCosts: 'Migration Costs',
    retirementCosts: 'Retirement',
    riskMitigation: 'Risk Mitigation',
    contingency: 'Contingency',
  };

  const totalCost = Object.values(costs).reduce((sum: number, val: any) => sum + (val as number), 0);
  const maxCost = Math.max(...Object.values(costs).map((v: any) => v as number));

  // Sort categories by amount
  const sortedCategories = Object.entries(costs).sort(([, a], [, b]) => (b as number) - (a as number));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Annual TCO"
          value={`$${(tco.annualTCO / 1000).toFixed(0)}K`}
          icon={DollarSign}
          color="text-amber-400"
          bgColor="bg-amber-500/10"
        />
        <SummaryCard
          title="Monthly TCO"
          value={`$${(tco.monthlyTCO / 1000).toFixed(1)}K`}
          icon={TrendingUp}
          color="text-teal-400"
          bgColor="bg-teal-500/10"
        />
        <SummaryCard
          title="Period"
          value={`${tco.calculationPeriodMonths} months`}
          icon={BarChart3}
          color="text-blue-400"
          bgColor="bg-blue-500/10"
        />
      </div>

      {/* Cost Breakdown Bar Chart */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-amber-400" />
          Cost Breakdown
        </h3>

        <div className="space-y-3">
          {sortedCategories.map(([key, value]) => {
            const numValue = value as number;
            const percentage = (numValue / totalCost) * 100;
            const isExpanded = expandedCategory === key;
            const width = (numValue / maxCost) * 100;

            return (
              <div key={key} className="space-y-2">
                <div
                  className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors"
                  onClick={() => setExpandedCategory(isExpanded ? null : key)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-3 h-3 rounded-full ${categoryColors[key]}`}></div>
                    <span className="font-medium text-white">{categoryLabels[key]}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">{percentage.toFixed(1)}%</span>
                    <span className="font-semibold text-white">${(numValue / 1000).toFixed(0)}K</span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="ml-6 p-4 bg-slate-800/30 border border-slate-700 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-slate-500 mb-1">Annual Cost</div>
                        <div className="text-xl font-bold text-white">
                          ${(numValue / 1000).toFixed(0)}K
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500 mb-1">Monthly Cost</div>
                        <div className="text-xl font-bold text-white">
                          ${(numValue / 12000).toFixed(1)}K
                        </div>
                      </div>
                    </div>

                    {/* Visual bar */}
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${categoryColors[key]} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    {/* Additional details could go here */}
                    <div className="text-xs text-slate-500">
                      This category represents {percentage.toFixed(1)}% of total TCO
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pie Chart Representation */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-amber-400" />
          Cost Distribution
        </h3>

        <div className="flex items-center gap-8">
          {/* Simple CSS Pie Chart */}
          <div className="relative w-64 h-64">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              {sortedCategories.map(([key, value], index) => {
                const numValue = value as number;
                const percentage = (numValue / totalCost) * 100;
                const dashArray = `${percentage} ${100 - percentage}`;
                const offset = sortedCategories
                  .slice(0, index)
                  .reduce((sum: number, [, val]) => sum + ((val as number) / totalCost) * 100, 0);

                return (
                  <circle
                    key={key}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={categoryColors[key].replace('bg-', 'stroke-')}
                    strokeWidth="20"
                    strokeDasharray={dashArray}
                    strokeDashoffset={-offset}
                    className="transition-all duration-300 hover:opacity-80 hover:stroke-width-[22]"
                    style={{ transformOrigin: 'center' }}
                  />
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            {sortedCategories.map(([key, value]) => {
              const numValue = value as number;
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-sm ${categoryColors[key]}`}></div>
                  <span className="flex-1 text-white">{categoryLabels[key]}</span>
                  <span className="text-slate-400">{((numValue / totalCost) * 100).toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <span className="text-sm text-slate-400">{title}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}
