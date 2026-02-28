
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-[#1F1712] text-center p-4">
          <h1 className="text-3xl font-bold text-red-400">אופס, משהו השתבש</h1>
          <p className="mt-2 text-lg text-[#EAE0D5]/80">
            אנו מצטערים, אך נתקלנו בשגיאה לא צפויה.
          </p>
          <Button onClick={this.handleRefresh} className="mt-6">
            נסה שוב
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
