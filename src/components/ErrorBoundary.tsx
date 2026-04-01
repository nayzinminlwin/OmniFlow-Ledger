import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Silently handle uncaught errors in production-like environments if requested,
    // but usually ErrorBoundary is for real crashes.
    // For now, we just remove the console.error as requested.
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel rounded-[2.5rem] p-10 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-[22px] font-semibold text-[var(--color-ios-text)] mb-3 tracking-tight">Application Notice</h1>
            <p className="text-[15px] text-[var(--color-ios-text-secondary)] mb-8 leading-relaxed">
              The application encountered an unexpected state. Please try refreshing.
            </p>
            <div className="bg-black/5 rounded-2xl p-4 mb-8 text-left overflow-auto max-h-40 border border-white/10">
              {(() => {
                try {
                  const errInfo = JSON.parse(this.state.error?.message || '');
                  if (errInfo && errInfo.error) {
                    return (
                      <div className="space-y-2">
                        <p className="text-[13px] text-red-500 font-semibold">Notice: {errInfo.operationType}</p>
                        <p className="text-[12px] text-[var(--color-ios-text-secondary)] font-mono break-all">{errInfo.error}</p>
                        <p className="text-[11px] text-[var(--color-ios-text-secondary)] opacity-50">Path: {errInfo.path}</p>
                      </div>
                    );
                  }
                } catch (e) {
                  // Not a JSON error
                }
                return (
                  <code className="text-[13px] text-red-500 font-mono">
                    {this.state.error?.message}
                  </code>
                );
              })()}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="ios-button w-full !bg-red-500 hover:!bg-red-600 text-white"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
