interface PageWrapperProps {
  children: React.ReactNode;
  title?: string;
}

export function PageWrapper({ children, title }: PageWrapperProps) {
  return (
    <div className="space-y-6">
      {title && (
        <div className="border-b border-gray-800 pb-4">
          <h1 className="text-2xl font-extrabold text-white">{title}</h1>
        </div>
      )}
      {children}
    </div>
  );
}