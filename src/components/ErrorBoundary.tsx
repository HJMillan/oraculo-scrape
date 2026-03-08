import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center p-8 text-center gap-4">
          <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">Algo salió mal</h1>
          <p className="text-gray-400 text-sm max-w-sm">
            Ocurrió un error inesperado. Intentá recargar la página.
          </p>
          <button
            onClick={() => globalThis.location.reload()}
            className="mt-2 px-6 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold uppercase text-sm tracking-wider rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base outline-none"
          >
            Recargar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
