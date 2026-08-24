import * as React from 'react';
import { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  public props!: Props;

  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Samahani, kuna tatizo limetokea.</h2>
            <button
              className="px-4 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-500"
              onClick={() => window.location.reload()}
            >
              Jaribu Tena
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
