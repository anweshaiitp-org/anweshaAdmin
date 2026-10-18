'use client';

import React from 'react';
import { FiCheck, FiX } from 'react-icons/fi';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  badge?: string;
  activeColor?: string; // e.g. 'bg-emerald-500'
  size?: 'sm' | 'md' | 'lg';
  isDark?: boolean;
  id?: string;
}

export default function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  badge,
  activeColor = 'bg-emerald-500',
  size = 'md',
  isDark = true,
  id
}: ToggleSwitchProps) {
  const switchDimensions = {
    sm: { track: 'w-10 h-6', thumb: 'w-4 h-4', translate: 'translate-x-4', iconSize: 10 },
    md: { track: 'w-14 h-8', thumb: 'w-6 h-6', translate: 'translate-x-6', iconSize: 13 },
    lg: { track: 'w-16 h-9', thumb: 'w-7 h-7', translate: 'translate-x-7', iconSize: 15 }
  }[size];

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const switchButton = (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      onClick={handleToggle}
      className={`relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out p-1 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
        switchDimensions.track
      } ${
        checked
          ? `${activeColor} shadow-md shadow-emerald-500/25`
          : isDark
          ? 'bg-gray-700/80 hover:bg-gray-650 border border-gray-600/50'
          : 'bg-gray-200 hover:bg-gray-300 border border-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className="sr-only">{label || 'Toggle switch'}</span>
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-flex items-center justify-center transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
          switchDimensions.thumb
        } ${checked ? switchDimensions.translate : 'translate-x-0'}`}
      >
        {checked ? (
          <FiCheck className="text-emerald-600 font-black stroke-[3]" size={switchDimensions.iconSize} />
        ) : (
          <FiX className="text-gray-400 font-black stroke-[3]" size={switchDimensions.iconSize} />
        )}
      </span>
    </button>
  );

  if (!label && !description) {
    return switchButton;
  }

  return (
    <div
      onClick={handleToggle}
      className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
        isDark
          ? checked
            ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
            : 'bg-gray-900/60 border-gray-700/60 hover:border-gray-600'
          : checked
          ? 'bg-emerald-50/60 border-emerald-300 hover:border-emerald-400'
          : 'bg-gray-50/70 border-gray-200 hover:border-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
    >
      <div className="flex-1 pr-2">
        <div className="flex items-center gap-2.5">
          <span className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {label}
          </span>
          {badge && (
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider ${
                checked
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-gray-500/15 text-gray-400 border border-gray-500/30'
              }`}
            >
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {description}
          </p>
        )}
      </div>

      <div onClick={(e) => e.stopPropagation()}>{switchButton}</div>
    </div>
  );
}
