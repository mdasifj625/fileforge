"use client";

import React, { Component, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  toolName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class FeatureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `[FeatureErrorBoundary] Caught error in tool: ${this.props.toolName || "Unknown"}`,
      error,
      errorInfo,
    );
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-red-500 text-lg mb-1">
              Tool Crashed
            </h3>
            <p className="text-sm text-red-400/80 mb-4 break-words">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium text-sm"
          >
            <RefreshCw size={16} />
            Reload Tool
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
