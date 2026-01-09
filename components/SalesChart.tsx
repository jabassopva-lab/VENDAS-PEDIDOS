import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SalesData } from '../types';

interface SalesChartProps {
  data: SalesData[];
}

const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Desempenho de Vendas</h2>
      <div className="h-full w-full pb-8">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6b7280', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6b7280', fontSize: 12 }} 
              tickFormatter={(value) => `R$${value/1000}k`}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              formatter={(value: number) => [`R$ ${value.toLocaleString()}`, 'Receita']}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#4f46e5" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesChart;