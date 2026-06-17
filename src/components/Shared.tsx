import React from 'react';

export const POPULAR_MODELS = [
  { name: 'llama3:8b', size: '4.7GB', desc: 'Most popular general purpose model' },
  { name: 'phi3:mini', size: '2.3GB', desc: 'Powerful small model for faster inference' },
  { name: 'mistral:latest', size: '4.1GB', desc: 'Reliable and fast open source model' },
  { name: 'gemma2:9b', size: '5.5GB', desc: "Google's latest lightweight model" },
  { name: 'tinyllama:latest', size: '637MB', desc: 'Ultra-small for low resource systems' },
  { name: 'moondream:latest', size: '829MB', desc: 'Vision-capable small model' },
];

export const SidebarItem = ({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: any;
  label: string;
  active?: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

export const StatCard = ({
  icon: Icon,
  label,
  value,
  status,
}: {
  icon: any;
  label: string;
  value: string;
  status: string;
}) => (
  <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 hover:border-slate-700 transition-colors">
    <div className="p-3 bg-slate-800 rounded-lg text-blue-400">
      <Icon size={24} />
    </div>
    <div>
      <p className="text-slate-500 text-sm font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <h3 className="text-xl font-bold text-slate-100">{value}</h3>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
            status === 'optimal'
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-amber-500/10 text-amber-400'
          }`}
        >
          {status}
        </span>
      </div>
    </div>
  </div>
);
