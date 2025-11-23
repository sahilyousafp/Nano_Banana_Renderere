import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: 'Geometry', val: 30 },
  { name: 'Lighting', val: 80 },
  { name: 'Texture', val: 50 },
  { name: 'Comp', val: 65 },
];

export const StatsPanel: React.FC = () => {
  return (
    <div className="w-full h-32 mt-4 bg-slate-900 rounded border border-slate-800 p-2 flex flex-col">
        <span className="text-[10px] uppercase text-slate-500 font-bold mb-2">Analysis Est.</span>
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} interval={0} />
                <YAxis hide />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '4px', fontSize: '12px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                    cursor={{fill: '#334155'}}
                />
                <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#06b6d4'} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
};