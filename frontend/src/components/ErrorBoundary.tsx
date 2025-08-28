import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', margin: '20px' }}>
          <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>오류가 발생했습니다</h2>
          <details style={{ whiteSpace: 'pre-wrap', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>오류 세부사항</summary>
            <div style={{ marginTop: '12px' }}>
              <strong>오류:</strong> {this.state.error && this.state.error.toString()}
              <br />
              <strong>스택 트레이스:</strong>
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </div>
          </details>
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              backgroundColor: '#dc2626', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            페이지 새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;