import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-4 my-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                {this.props.fallbackTitle || 'Section Display Interrupted'}
              </h3>
              <p className="text-xs text-amber-700">
                {this.state.error?.message || 'An unexpected rendering error occurred in this view.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-900 text-white rounded-lg text-xs font-semibold hover:bg-amber-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Reloading Section</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
