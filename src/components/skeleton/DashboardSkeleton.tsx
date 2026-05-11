export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="w-20 h-3 bg-gray-700 rounded mb-2" />
            <div className="w-16 h-8 bg-gray-700 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="w-40 h-4 bg-gray-700 rounded mb-4" />
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="w-full h-16 bg-gray-800 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}