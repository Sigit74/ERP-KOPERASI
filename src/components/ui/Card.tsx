import React from 'react';

interface CardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

export const KpiCard: React.FC<CardProps> = ({ title, value, icon: Icon, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-xs">
          <span className="text-green-600 font-medium">{trend}</span>
          <span className="text-slate-400 ml-2">vs bulan lalu</span>
        </div>
      )}
    </div>
  );
};