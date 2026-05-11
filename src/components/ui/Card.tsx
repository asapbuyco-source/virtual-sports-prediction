import { cn } from "@/utils/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn("bg-gray-900 border border-gray-800 rounded-2xl p-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}