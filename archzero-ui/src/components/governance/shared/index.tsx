/**
 * Shared UI Components for Governance
 * Reusable badges, indicators, and utility components
 */

import { cva, type VariantProps } from 'class-variance-authority';
import { clsx, type ClassValue } from 'clsx';
import { type LucideIcon } from 'lucide-react';

// ============================================================================
// STATUS BADGES
// ============================================================================

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide transition-all',
  {
    variants: {
      variant: {
        // General status
        active: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        inactive: 'bg-slate-100 text-slate-700 border border-slate-200',

        // Initiative status
        proposed: 'bg-blue-50 text-blue-700 border border-blue-200',
        approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        inProgress: 'bg-amber-50 text-amber-700 border border-amber-200',
        onHold: 'bg-slate-100 text-slate-700 border border-slate-300',
        completed: 'bg-teal-50 text-teal-700 border border-teal-200',
        cancelled: 'bg-red-50 text-red-700 border border-red-200',

        // Risk status
        open: 'bg-rose-50 text-rose-700 border border-rose-200',
        mitigated: 'bg-blue-50 text-blue-700 border border-blue-200',
        accepted: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
        transferred: 'bg-purple-50 text-purple-700 border border-purple-200',
        closed: 'bg-slate-100 text-slate-600 border border-slate-300',

        // Exception status
        pending: 'bg-amber-50 text-amber-700 border border-amber-200',
        rejected: 'bg-red-50 text-red-700 border border-red-200',
        expired: 'bg-gray-50 text-gray-600 border border-gray-300',

        // ARB meeting status
        scheduled: 'bg-blue-50 text-blue-700 border border-blue-200',
        arbInProgress: 'bg-violet-50 text-violet-700 border border-violet-200',

        // Compliance status
        compliant: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        nonCompliant: 'bg-red-50 text-red-700 border border-red-200',
        exempt: 'bg-slate-50 text-slate-600 border border-slate-300',
        partial: 'bg-amber-50 text-amber-700 border border-amber-200',
      },
    },
    defaultVariants: {
      variant: 'active',
    },
  }
);

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: VariantProps<typeof statusBadgeVariants>['variant'];
  children: React.ReactNode;
}

export function StatusBadge({ variant, children, className, ...props }: StatusBadgeProps) {
  return (
    <span className={clsx(statusBadgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  );
}

// ============================================================================
// PRIORITY BADGES
// ============================================================================

const priorityBadgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide',
  {
    variants: {
      priority: {
        critical: 'bg-rose-600 text-white shadow-sm',
        high: 'bg-orange-500 text-white shadow-sm',
        medium: 'bg-amber-400 text-white shadow-sm',
        low: 'bg-blue-500 text-white shadow-sm',
      },
    },
    defaultVariants: {
      priority: 'medium',
    },
  }
);

export interface PriorityBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  priority?: 'critical' | 'high' | 'medium' | 'low';
  children: React.ReactNode;
}

export function PriorityBadge({ priority, children, className, ...props }: PriorityBadgeProps) {
  return (
    <span className={clsx(priorityBadgeVariants({ priority }), className)} {...props}>
      {children}
    </span>
  );
}

// ============================================================================
// CATEGORY BADGES
// ============================================================================

const categoryColors: Record<string, string> = {
  Strategic: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
  Business: 'bg-blue-100 text-blue-800 border border-blue-200',
  Technical: 'bg-teal-100 text-teal-800 border border-teal-200',
  Data: 'bg-purple-100 text-purple-800 border border-purple-200',
  Security: 'bg-rose-100 text-rose-800 border border-rose-200',
  Languages: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
  Frameworks: 'bg-violet-100 text-violet-800 border border-violet-200',
  Infrastructure: 'bg-slate-100 text-slate-800 border border-slate-200',
};

export interface CategoryBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  category: string;
}

export function CategoryBadge({ category, className, ...props }: CategoryBadgeProps) {
  const colors = categoryColors[category] || 'bg-gray-100 text-gray-800 border border-gray-200';

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold',
        colors,
        className
      )}
      {...props}
    >
      {category}
    </span>
  );
}

// ============================================================================
// ICON BADGES
// ============================================================================

export interface IconBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function IconBadge({ icon: Icon, label, variant = 'default', className, ...props }: IconBadgeProps) {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-rose-100 text-rose-700',
  };

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </div>
  );
}

// ============================================================================
// METADATA DISPLAY
// ============================================================================

export interface MetadataItemProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
}

export function MetadataItem({ label, value, icon: Icon, className, ...props }: MetadataItemProps) {
  return (
    <div className={clsx('flex items-start gap-2 text-sm', className)} {...props}>
      {Icon && <Icon className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{label}</p>
        <p className="mt-0.5 text-slate-900 font-medium">{value}</p>
      </div>
    </div>
  );
}

// ============================================================================
// COMPLIANCE INDICATOR
// ============================================================================

interface ComplianceIndicatorProps {
  rate: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ComplianceIndicator({ rate, size = 'md', showLabel = false }: ComplianceIndicatorProps) {
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const getColor = (rate: number) => {
    if (rate >= 80) return 'bg-emerald-500';
    if (rate >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className={clsx('flex-1 bg-slate-100 rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={clsx('h-full rounded-full transition-all duration-500', sizeClasses[size], getColor(rate))}
          style={{ width: `${rate}%` }}
        />
      </div>
      {showLabel && (
        <span className={clsx(
          'text-sm font-semibold',
          rate >= 80 ? 'text-emerald-700' : rate >= 60 ? 'text-amber-700' : 'text-rose-700'
        )}>
          {rate}%
        </span>
      )}
    </div>
  );
}

// ============================================================================
// CARD CONTAINER
// ============================================================================

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Card({ variant = 'default', padding = 'md', children, className, ...props }: CardProps) {
  const variantStyles = {
    default: 'bg-white border border-slate-200',
    bordered: 'bg-white border-2 border-slate-300',
    elevated: 'bg-white border border-slate-200 shadow-lg',
    ghost: 'bg-transparent border-0',
  };

  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={clsx(
        'rounded-xl transition-all',
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
