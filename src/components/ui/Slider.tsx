interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

export function Slider({ value, onChange, min = 1, max = 10, label }: SliderProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-xs text-gray-400 uppercase tracking-wider">
          {label}: <span className="text-white font-bold">{value}</span>
        </label>
      )}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-green-500"
      />
    </div>
  );
}