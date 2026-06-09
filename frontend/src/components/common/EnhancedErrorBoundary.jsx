import React from "react";
import { FiAlertCircle, FiMail, FiRotateCw } from "react-icons/fi";

export class EnhancedErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Log error with ID for tracking
    const errorLog = {
      id: this.state.errorId,
      message: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Store in localStorage for debugging
    try {
      const logs = JSON.parse(localStorage.getItem("errorLogs") || "[]");
      logs.push(errorLog);
      // Keep only last 50 errors
      if (logs.length > 50) logs.shift();
      localStorage.setItem("errorLogs", JSON.stringify(logs));
    } catch (e) {
      console.error("Failed to store error log:", e);
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error Boundary caught:", errorLog);
    }

    // Optionally send to error tracking service (e.g., Sentry)
    if (window.__sendErrorToTracking) {
      window.__sendErrorToTracking(errorLog);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };

  handleContactSupport = () => {
    const errorId = this.state.errorId;
    const subject = `Support Request - Error ID: ${errorId}`;
    const body = `I encountered an error (ID: ${errorId}) while using Promesapay.\n\nError details:\n${this.state.error?.toString()}\n\nPlease help me resolve this issue.`;
    window.location.href = `mailto:support@promesapay.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 px-4 py-8">
          <div className="max-w-2xl w-full">
            {/* Main Error Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-4">
              {/* Icon */}
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 mx-auto mb-6">
                <FiAlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>

              {/* Error Title */}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                Oops! Something went wrong
              </h1>

              {/* Error Message */}
              <p className="text-gray-600 dark:text-gray-400 text-center mb-2">
                We encountered an unexpected error while processing your request.
              </p>

              {/* Error ID */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 mb-6 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Error ID</p>
                <p className="text-sm font-mono text-gray-700 dark:text-gray-300 select-all">
                  {this.state.errorId}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition"
                >
                  <FiRotateCw size={18} />
                  Try Again
                </button>
                <button
                  onClick={() => (window.location.href = "/")}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition"
                >
                  Go Home
                </button>
              </div>

              {/* Support Button */}
              <button
                onClick={this.handleContactSupport}
                className="w-full flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <FiMail size={18} />
                Contact Support with Error ID
              </button>
            </div>

            {/* Details Section (Development Only or if Details Shown) */}
            {(process.env.NODE_ENV === "development" || this.state.showDetails) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <button
                  onClick={() =>
                    this.setState({ showDetails: !this.state.showDetails })
                  }
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline mb-3"
                >
                  {this.state.showDetails ? "Hide" : "Show"} Technical Details
                </button>

                {this.state.showDetails && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                        Error Message
                      </p>
                      <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-auto max-h-40 text-gray-800 dark:text-gray-200">
                        {this.state.error?.toString()}
                      </pre>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                        Stack Trace
                      </p>
                      <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-auto max-h-40 text-gray-800 dark:text-gray-200">
                        {this.state.error?.stack}
                      </pre>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                        Component Stack
                      </p>
                      <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-auto max-h-40 text-gray-800 dark:text-gray-200">
                        {this.state.errorInfo?.componentStack}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Help Text */}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
              If this problem persists, please save your error ID and contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
