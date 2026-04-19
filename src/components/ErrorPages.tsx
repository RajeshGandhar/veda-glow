export function NotFoundPage() {
  const goHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-7xl font-extrabold text-emerald-600 mb-4">404</h1>
          <p className="text-3xl font-bold text-neutral-900 mb-2">
            Page Not Found
          </p>
          <p className="text-neutral-600 text-lg">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-emerald-100">
          <p className="text-sm text-neutral-600 mb-4">
            Here are some helpful links instead:
          </p>
          <div className="space-y-2">
            <a
              href="/"
              className="block text-emerald-600 hover:text-emerald-700 font-medium transition"
            >
              ← Back to Home
            </a>
            <a
              href="/#shop"
              className="block text-emerald-600 hover:text-emerald-700 font-medium transition"
            >
              Shop Products
            </a>
          </div>
        </div>

        <button
          onClick={goHome}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

export function ServerErrorPage() {
  const goHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-7xl font-extrabold text-red-600 mb-4">500</h1>
          <p className="text-3xl font-bold text-neutral-900 mb-2">
            Server Error
          </p>
          <p className="text-neutral-600 text-lg">
            Something went wrong on our end. Please try again later.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-red-100">
          <p className="text-sm text-neutral-600 mb-4">
            If the problem persists, please:
          </p>
          <div className="space-y-2 text-left">
            <p className="text-sm text-neutral-700">
              ✓ Clear your browser cache
            </p>
            <p className="text-sm text-neutral-700">
              ✓ Try again in a few moments
            </p>
            <p className="text-sm text-neutral-700">
              ✓ Contact support if issue continues
            </p>
          </div>
        </div>

        <button
          onClick={goHome}
          className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
