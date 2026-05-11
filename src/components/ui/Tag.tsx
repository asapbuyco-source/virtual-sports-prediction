import { cn } from "@/utils/cn";

interface TagProps {
  text: string;
  variant: "SAFE" | "VALUE" | "RISKY" | "INFO";
}

export function Tag({ text, variant }: TagProps) {
  const styles = {
    SAFE: "bg-green-600/20 text-green-400 border-green-600/40",
    VALUE: "bg-yellow-600/20 text-yellow-400 border-yellow-600/40",
    RISKY: "bg-red-600/20 text-red-400 border-red-600/40",
    INFO: "bg-blue-600/20 text-blue-400 border-blue-600/40",
  };

  return (
    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider", styles[variant])}>
      {text}
    </span>
  );
}