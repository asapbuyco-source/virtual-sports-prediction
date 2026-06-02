import { cn } from "@/utils/cn";

interface TabsProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      onChange(tabs[(index + 1) % tabs.length]);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      onChange(tabs[(index - 1 + tabs.length) % tabs.length]);
    }
  };

  return (
    <div className="flex border-b border-gray-800" role="tablist">
      {tabs.map((tab, index) => (
        <button
          key={tab}
          role="tab"
          aria-selected={activeTab === tab}
          tabIndex={activeTab === tab ? 0 : -1}
          onClick={() => onChange(tab)}
          onKeyDown={(e) => handleKeyDown(e, index)}
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