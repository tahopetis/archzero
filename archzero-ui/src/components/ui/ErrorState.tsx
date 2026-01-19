import React from 'react';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryCount?: number;
  errorType?: 'network' | 'server' | 'timeout' | 'offline' | 'general';
}

/**
 * ErrorState component - Displays error messages with retry option
 *
 * Test selectors:
 * - data-testid="error-message" - Main error container
 * - data-testid="error-title" - Error title
 * - data-testid="retry-btn" - Retry button
 * - data-testid="offline-banner" - Offline indicator
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
  retryCount,
  errorType = 'general',
}) => {
  const getErrorConfig = () => {
    switch (errorType) {
      case 'network':
        return {
          icon: <WifiOff className="h-8 w-8 text-orange-500" />,
          defaultTitle: 'Network Error',
          defaultMessage: 'Failed to connect to the server. Please check your connection.',
        };
      case 'server':
        return {
          icon: <AlertCircle className="h-8 w-8 text-red-500" />,
          defaultTitle: 'Server Error',
          defaultMessage: 'Something went wrong on the server. Please try again.',
        };
      case 'timeout':
        return {
          icon: <AlertCircle className="h-8 w-8 text-yellow-500" />,
          defaultTitle: 'Request Timeout',
          defaultMessage: 'The request took too long. Please try again.',
        };
      case 'offline':
        return {
          icon: <WifiOff className="h-8 w-8 text-gray-500" />,
          defaultTitle: 'You Are Offline',
          defaultMessage: 'No internet connection detected. Please check your connection.',
        };
      default:
        return {
          icon: <AlertCircle className="h-8 w-8 text-red-500" />,
          defaultTitle: 'Error',
          defaultMessage: 'An unexpected error occurred. Please try again.',
        };
    }
  };

  const config = getErrorConfig();
  const displayTitle = title || config.defaultTitle;
  const displayMessage = message || config.defaultMessage;

  return (
    <div
      data-testid="error-message"
      className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg"
    >
      <div className="flex items-center mb-4">
        {config.icon}
      </div>
      <h3
        data-testid="error-title"
        className="text-lg font-semibold text-gray-900 mb-2"
      >
        {displayTitle}
      </h3>
      <p className="text-sm text-gray-600 mb-4 text-center max-w-md">
        {displayMessage}
      </p>
      {retryCount !== undefined && retryCount > 0 && (
        <p className="text-xs text-gray-500 mb-4">
          Retry attempt {retryCount}
        </p>
      )}
      {onRetry && (
        <button
          data-testid="retry-btn"
          onClick={onRetry}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </button>
      )}
    </div>
  );
};

/**
 * OfflineBanner component - Shows at top of page when offline
 */
export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div
      data-testid="offline-banner"
      className="fixed top-0 left-0 right-0 bg-gray-800 text-white px-4 py-2 text-center z-50 flex items-center justify-center"
    >
      <WifiOff className="h-4 w-4 mr-2" />
      <span className="text-sm">You are offline. Some features may not work.</span>
    </div>
  );
};

/**
 * Inline error message for form fields
 */
export const InlineError: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div
      data-testid="inline-error"
      className="flex items-center mt-1 text-sm text-red-600"
    >
      <AlertCircle className="h-3 w-3 mr-1" />
      <span>{message}</span>
    </div>
  );
};

/**
 * Success toast/notification
 */
export const SuccessMessage: React.FC<{ message: string; onClose?: () => void }> = ({
  message,
  onClose,
}) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      data-testid="success-message"
      className="flex items-center justify-between bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4"
    >
      <span className="text-sm">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-green-600 hover:text-green-800"
        >
          ×
        </button>
      )}
    </div>
  );
};
