import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface AdminDropdownProps {
  label: string;
  icon?: React.ReactNode;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  className?: string;
  align?: 'left' | 'right';
}

export const AdminDropdown: React.FC<AdminDropdownProps> = ({
  label,
  icon,
  value,
  options,
  onChange,
  className = '',
  align = 'right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-semibold transition-all duration-150 select-none ${
          isOpen
            ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900 shadow-md'
            : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:shadow-xs'
        }`}
      >
        {icon && (
          <span className="text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0">
            {icon}
          </span>
        )}
        <span className="text-slate-400 font-medium whitespace-nowrap">{label}:</span>
        <span className="text-slate-800 font-bold whitespace-nowrap">{selectedOption?.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ml-0.5 ${
            isOpen ? 'rotate-180 text-emerald-600' : 'group-hover:text-slate-600'
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
          } top-full mt-2 min-w-[210px] sm:min-w-[240px] bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/80 p-1.5 z-50 animate-scaleUp`}
        >
          <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1 flex items-center justify-between">
            <span>Chọn {label.toLowerCase()}</span>
            {icon && <span className="opacity-70">{icon}</span>}
          </div>

          <div className="max-h-64 overflow-y-auto space-y-0.5">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    <span className="truncate">{option.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
