import React from 'react';
import { StatCardProps } from '../types';

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, positive, icon }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between transition-transform hover:scale-[1.02] duration-200">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {trend && (
          <p className={`text-xs font-medium mt-2 flex items-center ${positive ? 'text-green-600' : 'text-red-600'}`}>
            <span>{positive ? '↑' : '↓'} {trend}</span>
            <span className="text-gray-400 ml-1">vs mês anterior</span>
          </p>
        )}
      </div>
      <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
        {icon}
      </div>
    </div>
  );
};

export default StatCard;