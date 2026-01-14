/**
 * Architecture Principles Components
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Edit3,
  Trash2,
  Plus,
  ChevronDown,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { PrincipleCategory, type ArchitecturePrinciple } from '@/types/governance';
import { usePrinciples, usePrinciple, useDeletePrinciple, usePrincipleCompliance } from '@/lib/governance-hooks';
import {
  Card,
  StatusBadge,
  CategoryBadge,
  ComplianceIndicator,
  IconBadge,
  MetadataItem,
  cn
} from '../shared';

// ============================================================================
// PRINCIPLE CARD
// ============================================================================

interface PrincipleCardProps {
  principle: ArchitecturePrinciple;
  onEdit?: (principle: ArchitecturePrinciple) => void;
}

export function PrincipleCard({ principle, onEdit }: PrincipleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card variant="elevated" className="group hover:shadow-xl transition-all duration-300" data-testid={`principle-item-${principle.id}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold text-slate-900">{principle.name}</h3>
            <CategoryBadge category={principle.category} />
          </div>

          <p className="text-slate-600 text-sm leading-relaxed mb-3 line-clamp-2">
            {principle.statement}
          </p>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            <span>{isExpanded ? 'Show less' : 'Show more'}</span>
            <ChevronDown className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} />
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Rationale</p>
                <p className="text-sm text-slate-700">{principle.rationale}</p>
              </div>

              {principle.implications.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Implications</p>
                  <ul className="space-y-1">
                    {principle.implications.map((implication, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="text-indigo-500 mt-1">•</span>
                        <span>{implication}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                <MetadataItem label="Owner" value={principle.owner} icon={BookOpen} />
                <div className="flex-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Adherence</p>
                  <ComplianceIndicator rate={principle.adherenceRate} size="sm" showLabel />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit?.(principle)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit principle"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// PRINCIPLES LIST
// ============================================================================

interface PrinciplesListProps {
  category?: PrincipleCategory;
  onEdit?: (principle: ArchitecturePrinciple) => void;
}

export function PrinciplesList({ category, onEdit }: PrinciplesListProps) {
  const { data: principles, isLoading, error } = usePrinciples({ category });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-2" />
          <p className="text-slate-600">Failed to load principles</p>
        </div>
      </div>
    );
  }

  if (!principles?.data.length) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">No principles found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="principles-list">
      {principles.data.map((principle) => (
        <PrincipleCard key={principle.id} principle={principle} onEdit={onEdit} />
      ))}
    </div>
  );
}

// ============================================================================
// PRINCIPLE DETAIL
// ============================================================================

interface PrincipleDetailProps {
  id: string;
  onEdit?: (principle: ArchitecturePrinciple) => void;
}

export function PrincipleDetail({ id, onEdit }: PrincipleDetailProps) {
  const { data: principle, isLoading } = usePrinciple(id);
  const { data: compliance } = usePrincipleCompliance(id);

  if (isLoading) {
    return <div className="animate-pulse bg-slate-100 h-64 rounded-xl" />;
  }

  if (!principle) {
    return <div>Principle not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-slate-900">{principle.name}</h1>
            <CategoryBadge category={principle.category} />
          </div>
          <p className="text-slate-600 max-w-3xl">{principle.statement}</p>
        </div>
        <button
          onClick={() => onEdit?.(principle)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Edit3 className="w-4 h-4" />
          Edit
        </button>
      </div>

      {/* Details Card */}
      <Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <MetadataItem label="Rationale" value={principle.rationale} icon={TrendingUp} />
            <MetadataItem label="Owner" value={principle.owner} icon={BookOpen} />
            <MetadataItem
              label="Adherence Rate"
              value={<ComplianceIndicator rate={principle.adherenceRate} showLabel />}
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Implications</p>
            <ul className="space-y-2">
              {principle.implications.map((implication, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">{idx + 1}.</span>
                  <span>{implication}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Compliance Report */}
      {compliance && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Compliance Report</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">{compliance.totalCards}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Total Cards</p>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <p className="text-2xl font-bold text-emerald-700">{compliance.compliantCards}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Compliant</p>
              </div>
              <div className="text-center p-4 bg-rose-50 rounded-lg">
                <p className="text-2xl font-bold text-rose-700">{compliance.totalCards - compliance.compliantCards}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Violations</p>
              </div>
            </div>

            {compliance.violations.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Violations</p>
                <div className="space-y-2">
                  {compliance.violations.map((violation, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-rose-50 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{violation.cardName}</p>
                        <p className="text-xs text-slate-600">{violation.violation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
