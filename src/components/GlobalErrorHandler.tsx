"use client";

import React from "react";

// ---------------------------------------------------------------------------
// Console formatting helpers
// ---------------------------------------------------------------------------

const PREFIX = "[FileForge] 🔴 UNHANDLED EXCEPTION";

function logError(
  label: string,
  error: unknown,
  extra?: Record<string, unknown>,
) {
  const err = error instanceof Error ? error : new Error(String(error));

  console.group(`%c${PREFIX} — ${label}`, "color: #ef4444; font-weight: bold;");
  console.error("Message :", err.message);
  console.error("Name    :", err.name);
  if (err.stack) {
    console.error("Stack   :\n" + err.stack);
  }
  if (extra && Object.keys(extra).length > 0) {
    console.error("Details :", extra);
  }
  if (error instanceof Error && (error as NodeJS.ErrnoException).cause) {
    console.error("Cause   :", (error as NodeJS.ErrnoException).cause);
  }
  console.groupEnd();
}

// ---------------------------------------------------------------------------
// React Error Boundary — catches errors thrown during rendering / lifecycle
// ---------------------------------------------------------------------------

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ReactErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logError("React Render / Lifecycle", error, {
      componentStack: info.componentStack ?? "unavailable",
    });
  }

  render() {
    // Pass-through: we only log, we do NOT replace the UI with a fallback
    // so the app keeps running as much as possible.
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Window-level handler — catches everything outside React's tree
// ---------------------------------------------------------------------------

function WindowErrorListeners() {
  React.useEffect(() => {
    /** Uncaught synchronous JS errors */
    const handleError = (event: ErrorEvent) => {
      logError("Uncaught JS Exception", event.error ?? event.message, {
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
      });
      // Do NOT call event.preventDefault() — keep native browser reporting intact
    };

    /** Unhandled Promise rejections */
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      logError(
        "Unhandled Promise Rejection",
        reason instanceof Error ? reason : new Error(String(reason)),
        {
          promiseReason: reason,
        },
      );
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  return null;
}

// ---------------------------------------------------------------------------
// Public export — wrap the app with this once in the root layout
// ---------------------------------------------------------------------------

export function GlobalErrorHandler({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactErrorBoundary>
      <WindowErrorListeners />
      {children}
    </ReactErrorBoundary>
  );
}
