'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-seasalt p-6 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
            <h2 className="text-2xl font-bold text-gunmetal mb-2">Critical Error</h2>
            <p className="text-battleship-gray mb-8">
              A critical error occurred. Please restart the application.
            </p>
            <button
              onClick={() => reset()}
              className="w-full py-3 px-4 bg-red-600 text-white font-bold rounded-xl"
            >
              Restart App
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
