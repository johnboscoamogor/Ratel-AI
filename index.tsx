import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n'; // Import the i18n configuration

// Error Boundary Component to catch crashes and display a fallback UI
interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
}
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // FIX: Replaced constructor with class property for state initialization.
  // This is a more modern approach and resolves TypeScript errors where 'state' and 'props'
  // were not being found on the class instance. This fix addresses all reported errors for this file.
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Ratel AI App crashed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'white', backgroundColor: '#1f2937', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚙️ Ratel AI is refreshing</h1>
          <p>Please reload the page or check your connection.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <React.Suspense fallback="Loading...">
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.Suspense>
  </React.StrictMode>
);