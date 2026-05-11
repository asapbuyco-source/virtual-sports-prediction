import { cn } from "@/utils/cn";

interface TabsProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex border-b border-gray-800">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            "flex-1 py-3 text-xs font-bold uppercase tracking-widest transition",
            activeTab === tab
              ? "bg-gray-800 text-green-400 border-b-2 border-green-500"
              : "text-gray-500 hover:text-gray-300"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}