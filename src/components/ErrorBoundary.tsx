import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
            <div className="p-4 bg-rose-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-rose-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Something went wrong</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              An unexpected error occurred. Your work is safe — this is a client-side issue.
            </p>
            {this.state.error && (
              <details className="text-left bg-slate-950 border border-slate-800 rounded-lg p-3">
                <summary className="text-xs font-semibold text-slate-400 cursor-pointer hover:text-white transition-colors">
                  Error details
                </summary>
                <pre className="mt-2 text-[11px] text-rose-400 whitespace-pre-wrap break-words overflow-auto max-h-40">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={this.handleReset}
                className="bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-bold py-2.5 px-6 rounded-lg text-sm transition-all inline-flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 px-6 rounded-lg text-sm border border-slate-700 transition-all cursor-pointer"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
