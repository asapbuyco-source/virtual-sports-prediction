import { cn } from "@/utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "green" | "yellow" | "red" | "blue" | "gray";
  className?: string;
}

export function Badge({ children, variant = "gray", className }: BadgeProps) {
  const styles = {
    green: "bg-green-600/20 text-green-400 border-green-600/40",
    yellow: "bg-yellow-600/20 text-yellow-400 border-yellow-600/40",
    red: "bg-red-600/20 text-red-400 border-red-600/40",
    blue: "bg-blue-600/20 text-blue-400 border-blue-600/40",
    gray: "bg-gray-700/50 text-gray-300 border-gray-600/40",
  };

  return (
    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider", styles[variant], className)}>
      {children}
    </span>
  );
}