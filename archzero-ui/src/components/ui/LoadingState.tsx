import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

/**
 * LoadingState component - Displays loading spinner with optional message
 *
 * Test selectors:
 * - data-testid="loading-spinner" - Main loading container
 * - data-testid="loading-message" - Optional message text
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  size = 'md',
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50'
    : 'flex flex-col items-center justify-center p-8';

  return (
    <div
      data-testid="loading-spinner"
      className={containerClasses}
    >
      <Loader2 className={`animate-spin text-blue-600 ${sizeClasses[size]}`} />
      {message && (
        <p
          data-testid="loading-message"
          className="mt-2 text-sm text-gray-600"
        >
          {message}
        </p>
      )}
    </div>
  );
};

/**
 * Inline loading spinner for smaller contexts
 */
export const InlineLoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({
  size = 'sm',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div data-testid="inline-loading-spinner" className="flex items-center justify-center">
      <Loader2 className={`animate-spin text-blue-600 ${sizeClasses[size]}`} />
    </div>
  );
};

/**
 * Skeleton loader for card items
 */
export const CardSkeleton: React.FC = () => {
  return (
    <div
      data-testid="card-skeleton"
      className="bg-white rounded-lg shadow p-4 border border-gray-200 animate-pulse"
    >
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
    </div>
  );
};

/**
 * Skeleton loader for table rows
 */
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div data-testid="table-skeleton" className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      ))}
    </div>
  );
};
