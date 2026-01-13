import { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, ArrowRight, CheckCircle2, Info } from 'lucide-react';

interface MigrationRecommendationsProps {
  cardId: string;
}

interface Recommendation {
  type: string;
  label: string;
  color: string;
  bgColor: string;
  icon: any;
  description: string;
}

const recommendations: Record<string, Recommendation> = {
  Rehost: {
    type: 'rehost',
    label: 'Rehost',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    icon: TrendingUp,
    description: 'Lift and shift to cloud infrastructure with minimal changes',
  },
  Refactor: {
    type: 'refactor',
    label: 'Refactor',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10 border-cyan-500/30',
    icon: ArrowRight,
    description: 'Minimal changes for cloud compatibility',
  },
  Revise: {
    type: 'revise',
    label: 'Revise',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10 border-teal-500/30',
    icon: ArrowRight,
    description: 'Partial rewrite to modernize for cloud',
  },
  Replatform: {
    type: 'replatform',
    label: 'Replatform',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    icon: TrendingUp,
    description: 'Cloud-native re-platforming for optimal performance',
  },
  Replace: {
    type: 'replace',
    label: 'Replace',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/30',
    icon: Minus,
    description: 'Replace with commercial SaaS solution',
  },
  Retire: {
    type: 'retire',
    label: 'Retire',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/30',
    icon: AlertTriangle,
    description: 'Decommission and sunset the application',
  },
  Retain: {
    type: 'retain',
    label: 'Retain',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10 border-slate-500/30',
    icon: CheckCircle2,
    description: 'Keep as-is - no migration needed',
  },
};

export function MigrationRecommendations({ cardId }: MigrationRecommendationsProps) {
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState<any>(null);

  useEffect(() => {
    // Fetch recommendation from API
    // For now, mock data
    setTimeout(() => {
      setRecommendation({
        id: '1',
        cardId,
        cardName: 'Legacy Claims Processing System',
        recommendation: 'Replatform',
        reasoning: 'Application is 15 years old with VeryHigh customization and Critical priority. Recommend cloud-native re-platforming for optimal performance and maintainability.',
        effortEstimate: 'VeryHigh',
        costImpact: 'SignificantIncrease',
        riskAssessment: 'VeryHigh',
        confidenceScore: 0.87,
        alternativeOptions: ['Refactor', 'Retain'],
        assessedAt: new Date().toISOString(),
      });
      setLoading(false);
    }, 1000);
  }, [cardId]);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-1/3"></div>
          <div className="h-32 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!recommendation) return null;

  const rec = recommendations[recommendation.recommendation] || recommendations.Retain;
  const Icon = rec.icon;

  const effortColors = {
    None: 'text-slate-400',
    Low: 'text-emerald-400',
    Medium: 'text-yellow-400',
    High: 'text-orange-400',
    VeryHigh: 'text-red-400',
  };

  const riskColors = {
    VeryLow: 'text-emerald-400',
    Low: 'text-teal-400',
    Medium: 'text-yellow-400',
    High: 'text-orange-400',
    VeryHigh: 'text-red-400',
  };

  return (
    <div className="space-y-6">
      {/* Primary Recommendation Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-amber-500/50 rounded-2xl p-8 shadow-2xl shadow-amber-500/10">
        <div className="flex items-start gap-6">
          <div className={`p-4 rounded-xl ${rec.bgColor} border-2 ${rec.bgColor.split(' ')[0]}`}>
            <Icon className={`w-12 h-12 ${rec.color}`} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-3xl font-bold text-white">{rec.label}</h2>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium border border-amber-500/30">
                Primary Recommendation
              </span>
            </div>

            <p className="text-slate-300 text-lg leading-relaxed mb-6">{recommendation.reasoning}</p>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <MetricCard
                label="Effort"
                value={recommendation.effortEstimate}
                colorClass={effortColors[recommendation.effortEstimate as keyof typeof effortColors]}
              />
              <MetricCard
                label="Cost Impact"
                value={recommendation.costImpact}
                colorClass={recommendation.costImpact === 'SignificantSavings' ? 'text-emerald-400' : 'text-red-400'}
              />
              <MetricCard
                label="Risk"
                value={recommendation.riskAssessment}
                colorClass={riskColors[recommendation.riskAssessment as keyof typeof riskColors]}
              />
              <MetricCard
                label="Confidence"
                value={`${(recommendation.confidenceScore * 100).toFixed(0)}%`}
                colorClass="text-blue-400"
              />
            </div>

            {/* Confidence Bar */}
            <div className="bg-slate-800/50 rounded-full p-1">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000"
                    style={{ width: `${recommendation.confidenceScore * 100}%` }}
                  />
                </div>
                <span className="text-sm text-slate-400 font-medium">
                  {(recommendation.confidenceScore * 100).toFixed(0)}% Confident
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alternative Options */}
      {recommendation.alternativeOptions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-slate-400" />
            Alternative Strategies to Consider
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendation.alternativeOptions.map((alt: any) => {
              const altRec = recommendations[alt] || recommendations.Retain;
              const AltIcon = altRec.icon;
              return (
                <div
                  key={alt}
                  className="bg-slate-900 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`p-3 rounded-lg ${altRec.bgColor}`}>
                      <AltIcon className={`w-6 h-6 ${altRec.color}`} />
                    </div>
                    <div>
                      <div className="font-semibold text-white">{altRec.label}</div>
                      <div className="text-sm text-slate-500">{altRec.description}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, colorClass }: { label: string; value: string; colorClass: string }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
      <div className="text-sm text-slate-500 mb-1">{label}</div>
      <div className={`text-lg font-bold ${colorClass}`}>{value}</div>
    </div>
  );
}
