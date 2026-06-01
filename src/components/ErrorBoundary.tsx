import { Component, ReactNode, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ErrorBoundary ${this.state.errorId}]:`, error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            role="alert"
            aria-live="assertive"
            className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]"
          >
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
              <AlertTriangle size={28} className="text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Something went wrong
            </h3>
            <p className="text-gray-400 text-sm mb-1 max-w-md">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            {this.state.errorId && (
              <p className="text-[10px] text-gray-600 mb-4 font-mono">
                ID: {this.state.errorId}
              </p>
            )}
            <button
              onClick={this.handleRetry}
              className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 rounded-xl text-sm font-bold text-white transition-all duration-200 shadow-lg shadow-green-900/30"
            >
              <RefreshCw size={14} />
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-gray-400 transition-all duration-200"
            >
              Reload Page
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}