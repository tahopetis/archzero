/**
 * Technology Standards Components
 * Including Technology Radar visualization
 */

import { useMemo } from 'react';
import { Radar, Target, AlertTriangle, TrendingDown } from 'lucide-react';
import { TechnologyStatus, RadarQuadrant, RadarRing, type TechnologyStandard } from '@/types/governance';
import { useStandards, useTechnologyRadar, useDebtReport } from '@/lib/governance-hooks';
import {
  Card,
  StatusBadge,
  CategoryBadge,
  IconBadge,
  cn
} from '../shared';

// ============================================================================
// TECHNOLOGY RADAR VISUALIZATION
// ============================================================================

interface TechnologyRadarProps {
  data: TechnologyStandard[];
}

export function TechnologyRadarChart({ data }: TechnologyRadarProps) {
  // Group by quadrant and ring
  const rings = Object.values(RadarRing);

  const radarData = useMemo(() => {
    const quadrants = Object.values(RadarQuadrant);

    return quadrants.map(quadrant => {
      const quadrantTechs = data.filter(t => t.quadrant === quadrant);

      return rings.map(ring => {
        return {
          quadrant,
          ring,
          technologies: quadrantTechs.filter(t => t.ring === ring),
        };
      });
    });
  }, [data]);

  return (
    <div className="relative w-full aspect-square max-w-4xl mx-auto">
      {/* Radar circles */}
      <svg viewBox="0 0 400 400" className="w-full h-full">
        {/* Background circles */}
        <circle cx="200" cy="200" r="40" fill="none" className="stroke-slate-200" strokeWidth="1" />
        <circle cx="200" cy="200" r="90" fill="none" className="stroke-slate-200" strokeWidth="1" />
        <circle cx="200" cy="200" r="140" fill="none" className="stroke-slate-200" strokeWidth="1" />
        <circle cx="200" cy="200" r="190" fill="none" className="stroke-slate-200" strokeWidth="1" />

        {/* Quadrant dividers */}
        <line x1="200" y1="10" x2="200" y2="390" className="stroke-slate-200" strokeWidth="1" />
        <line x1="10" y1="200" x2="390" y2="200" className="stroke-slate-200" strokeWidth="1" />

        {/* Quadrant labels */}
        <text x="200" y="25" textAnchor="middle" className="text-xs font-semibold" fill="#64748b">
          Frameworks
        </text>
        <text x="200" y="385" textAnchor="middle" className="text-xs font-semibold" fill="#64748b">
          Infrastructure
        </text>
        <text x="25" y="205" textAnchor="middle" className="text-xs font-semibold" fill="#64748b">
          Languages
        </text>
        <text x="380" y="205" textAnchor="middle" className="text-xs font-semibold" fill="#64748b">
          Data/Storage
        </text>

        {/* Technology blips */}
        {radarData.map((quadrantGroup, qIdx) =>
          quadrantGroup.map((ringData, rIdx) => {
            if (ringData.technologies.length === 0) return null;

            // Calculate position for this quadrant/ring
            const angle = (qIdx * Math.PI / 2) + (rIdx * Math.PI / 8);
            const distance = 40 + (rings.indexOf(ringData.ring) + 1) * 50;
            const x = 200 + distance * Math.cos(angle);
            const y = 200 + distance * Math.sin(angle);

            return (
              <g key={`${quadrantGroup}-${ringData.ring}`}>
                {ringData.technologies.map(tech => (
                  <foreignObject
                    key={tech.id}
                    x={x - 30}
                    y={y - 15}
                    width="60"
                    height="30"
                    className="drop-shadow-lg"
                  >
                    <div className={cn(
                      'w-full h-full flex items-center justify-center rounded-lg px-2 text-xs font-semibold text-center',
                      ringData.ring === 'Adopt' && 'bg-emerald-500 text-white',
                      ringData.ring === 'Trial' && 'bg-blue-500 text-white',
                      ringData.ring === 'Assess' && 'bg-amber-500 text-white',
                      ringData.ring === 'Hold' && 'bg-slate-400 text-white'
                    )}>
                      {tech.name}
                    </div>
                  </foreignObject>
                ))}
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
}

// ============================================================================
// STANDARD CARD
// ============================================================================

interface StandardCardProps {
  standard: TechnologyStandard;
  onEdit?: (standard: TechnologyStandard) => void;
}

export function StandardCard({ standard, onEdit }: StandardCardProps) {
  const getStatusColor = (status: TechnologyStatus) => {
    switch (status) {
      case 'Adopt': return 'text-emerald-600 bg-emerald-50';
      case 'Trial': return 'text-blue-600 bg-blue-50';
      case 'Assess': return 'bg-amber-600 text-amber-50';
      case 'Hold': return 'text-slate-600 bg-slate-50';
      case 'Sunset': return 'text-orange-600 bg-orange-50';
      case 'Banned': return 'text-rose-600 bg-rose-50';
    }
  };

  return (
    <Card variant="bordered" className="group hover:shadow-lg transition-all" data-testid={`standard-item-${standard.id}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900 mb-1">{standard.name}</h3>
          <p className="text-sm text-slate-500">{standard.category}</p>
        </div>
        <span className={cn('px-3 py-1 rounded-full text-xs font-semibold uppercase', getStatusColor(standard.status))}>
          {standard.status}
        </span>
      </div>

      {standard.sunsetDate && (
        <div className="flex items-center gap-2 text-sm text-amber-600 mb-2">
          <AlertTriangle className="w-4 h-4" />
          <span>Sunset: {new Date(standard.sunsetDate).toLocaleDateString()}</span>
        </div>
      )}

      {standard.rationale && (
        <p className="text-sm text-slate-600 mb-3">{standard.rationale}</p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          Updated {new Date(standard.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </Card>
  );
}

// ============================================================================
// STANDARDS LIST
// ============================================================================

interface StandardsListProps {
  category?: string;
  status?: TechnologyStatus;
  onEdit?: (standard: TechnologyStandard) => void;
}

export function StandardsList({ category, status, onEdit }: StandardsListProps) {
  const { data: standards, isLoading } = useStandards({ category, status });

  if (isLoading) {
    return <div className="animate-pulse bg-slate-100 h-64 rounded-xl" />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="standards-list">
      {standards?.data.map((standard) => (
        <StandardCard key={standard.id} standard={standard} onEdit={onEdit} />
      ))}
    </div>
  );
}

// ============================================================================
// TECHNOLOGY RADAR PAGE
// ============================================================================

export function TechnologyRadarPage() {
  const { data: radar, isLoading: radarLoading } = useTechnologyRadar();
  const { data: standards } = useStandards();

  if (radarLoading || !standards) {
    return <div className="animate-pulse bg-slate-100 h-96 rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Technology Radar</h1>
          <p className="text-slate-600">Visual overview of technology standards and lifecycle</p>
        </div>
      </div>

      <Card className="p-8">
        <TechnologyRadarChart data={standards.data} />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <IconBadge icon={Target} label="Adopt" variant="success" className="mb-4" />
          <p className="text-sm text-slate-600">
            Technologies ready for production use. Low risk, proven in the industry.
          </p>
        </Card>
        <Card className="p-6">
          <IconBadge icon={Radar} label="Trial" variant="default" className="mb-4" />
          <p className="text-sm text-slate-600">
            Promising technologies worth exploring. Medium risk, evaluate for fit.
          </p>
        </Card>
        <Card className="p-6">
          <IconBadge icon={AlertTriangle} label="Assess" variant="warning" className="mb-4" />
          <p className="text-sm text-slate-600">
            Technologies under evaluation. Higher risk, requires validation.
          </p>
        </Card>
        <Card className="p-6">
          <IconBadge icon={TrendingDown} label="Hold" variant="danger" className="mb-4" />
          <p className="text-sm text-slate-600">
            Technologies to avoid or phase out. Deprecated or better alternatives exist.
          </p>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// DEBT REPORT
// ============================================================================

export function TechnologyDebtReport() {
  const { data: debtReport, isLoading } = useDebtReport();

  if (isLoading) {
    return <div className="animate-pulse bg-slate-100 h-64 rounded-xl" />;
  }

  if (!debtReport) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Technology Debt Report</h2>
          <p className="text-sm text-slate-600">Track technical debt from non-standard technologies</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-rose-600">{debtReport.totalDebtScore}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Debt Score</p>
        </div>
      </div>

      {debtReport.itemCount > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Technology</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Debt Score</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {debtReport.items.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-900">{item.standardName}</p>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge variant={item.status === 'Banned' ? 'rejected' : 'expired'}>
                      {item.status}
                    </StatusBadge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-sm font-semibold bg-rose-100 text-rose-700">
                      {item.debtScore}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-slate-700">
                    ${item.estimatedCost.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-slate-500">No technology debt found</p>
        </div>
      )}
    </Card>
  );
}
