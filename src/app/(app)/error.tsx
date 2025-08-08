'use client';

import React from 'react';

export default function AppSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-xl bg-white rounded-lg shadow-lg p-6 border border-gray-100">
        <div className="flex items-center mb-4">
          <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h2 className="text-xl font-bold text-red-600">Something went wrong</h2>
            {error?.digest ? (
              <p className="text-xs text-gray-500">Error ID: {error.digest}</p>
            ) : null}
          </div>
        </div>

        <p className="text-gray-600 mb-4">
          An unexpected error occurred while rendering this section. You can try again or return to the dashboard.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <button
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            onClick={() => reset()}
          >
            Try again
          </button>
          <button
            className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
          <button
            className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            onClick={() => (window.location.href = '/')}
          >
            Go to Dashboard
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && error?.message ? (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Show technical details
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-60 whitespace-pre-wrap">
              {error.message}
            </pre>
          </details>
        ) : null}
      </div>
    </div>
  );
}