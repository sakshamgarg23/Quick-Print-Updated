export default function NotFound() {
    return (
      <div className="container mx-auto p-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-8">Printer not found</p>
          <a
            href="/"
            className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }