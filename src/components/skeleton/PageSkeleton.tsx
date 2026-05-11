export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
    </div>
  );
}