import React from "react";

// Simple error boundary to surface runtime errors instead of a white screen
export class ErrorBoundary extends React.Component<React.PropsWithChildren, { hasError: boolean; error?: Error }> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console for quick debugging
    console.error("ErrorBoundary caught: ", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, fontFamily: "ui-sans-serif, system-ui" }}>
          <h2 style={{ marginBottom: 8 }}>💥 Something broke while rendering.</h2>
          <p style={{ color: "#475569", marginBottom: 8 }}>Check the browser console for details. Here’s a quick summary:</p>
          <pre style={{ background: "#f1f5f9", padding: 12, borderRadius: 8, overflow: "auto" }}>
            {String(this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}