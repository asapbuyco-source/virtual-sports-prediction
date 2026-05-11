export function PredictionSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-700 rounded-full" />
            <div className="w-24 h-8 bg-gray-700 rounded-lg" />
            <div className="w-12 h-12 bg-gray-700 rounded-full" />
          </div>
          <div className="w-32 h-10 bg-gray-700 rounded-lg" />
        </div>
        <div className="mt-4 w-full h-3 bg-gray-700 rounded-full" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex justify-around">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-22 h-22 bg-gray-700 rounded-full" />
              <div className="w-16 h-3 bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>

      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex justify-between mb-3">
            <div className="space-y-2">
              <div className="w-20 h-2 bg-gray-700 rounded" />
              <div className="w-32 h-4 bg-gray-700 rounded" />
            </div>
            <div className="w-12 h-12 bg-gray-700 rounded-lg" />
          </div>
          <div className="w-full h-2 bg-gray-700 rounded" />
          <div className="w-4/5 h-2 bg-gray-700 rounded mt-1" />
        </div>
      ))}
    </div>
  );
}