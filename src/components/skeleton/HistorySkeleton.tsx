export function HistorySkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex gap-4 mb-4">
        <div className="w-40 h-10 bg-gray-800 rounded-lg" />
        <div className="w-40 h-10 bg-gray-800 rounded-lg" />
      </div>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex justify-between mb-2">
            <div className="w-48 h-4 bg-gray-700 rounded" />
            <div className="w-24 h-4 bg-gray-700 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="w-16 h-3 bg-gray-700 rounded" />
            <div className="w-16 h-3 bg-gray-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}