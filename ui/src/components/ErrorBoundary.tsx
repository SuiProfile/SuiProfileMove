import React, { Component, ReactNode } from 'react';
import { Box, Text, Button } from '@radix-ui/themes';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            padding: '20px'
          }}
        >
          <Box
            style={{
              maxWidth: '500px',
              textAlign: 'center',
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '40px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Text size="6" style={{ color: '#ef4444', marginBottom: '16px' }}>
              ⚠️ Something went wrong
            </Text>
            <Text size="3" style={{ color: '#6b7280', marginBottom: '24px' }}>
              We encountered an unexpected error. Please try refreshing the page.
            </Text>
            {this.state.error && (
              <Box
                style={{
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '24px',
                  textAlign: 'left'
                }}
              >
                <Text size="2" style={{ color: '#374151', fontFamily: 'monospace' }}>
                  {this.state.error.message}
                </Text>
              </Box>
            )}
            <Button
              onClick={this.handleReset}
              style={{
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Try Again
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}
