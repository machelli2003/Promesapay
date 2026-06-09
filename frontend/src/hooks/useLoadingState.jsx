import React from "react";
import { LoadingSpinner } from "../components/ui";

/**
 * withLoadingState - Higher Order Component for managing loading states
 * Wraps a component and provides loading, error, and retry functionality
 *
 * Usage:
 * const EnhancedComponent = withLoadingState(MyComponent);
 * <EnhancedComponent isLoading={true} error={error} onRetry={() => {}} />
 */
export const withLoadingState = (Component) => {
  return ({
    isLoading = false,
    error = null,
    onRetry = null,
    loadingMessage = "Loading...",
    errorMessage = "An error occurred",
    children,
    ...props
  }) => {
    if (isLoading) {
      return (
        <div className="w-full flex flex-col items-center justify-center py-12 px-4">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">{loadingMessage}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="w-full flex flex-col items-center justify-center py-12 px-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-center max-w-md">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              Error
            </h3>
            <p className="text-sm text-red-800 dark:text-red-200 mb-4">
              {error.message || errorMessage}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      );
    }

    return <Component {...props}>{children}</Component>;
  };
};

/**
 * useLoadingState - Custom hook for managing loading states with data fetching
 *
 * Usage:
 * const { isLoading, error, data, retry } = useLoadingState(fetchFn, dependencies);
 */
export const useLoadingState = (fetchFn, dependencies = []) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [data, setData] = React.useState(null);

  const execute = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err);
      console.error("Loading state error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn]);

  const retry = React.useCallback(() => {
    execute();
  }, [execute]);

  React.useEffect(() => {
    execute();
  }, dependencies);

  return { isLoading, error, data, retry, setData };
};
