'use client';
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '@/lib/supabase/auth';
import { Loader2 } from 'lucide-react';

interface MonthlyData {
  month: string;
  applications: number;
}

export const MonthlyApplicantsChart: React.FC = () => {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonthlyData();
  }, []);

  const fetchMonthlyData = async () => {
    try {
      // Fetch all applications
      const { data: applications, error } = await supabase
        .from('applications')
        .select('created_at');

      if (error) throw error;

      // Group by month
      const monthCounts: Record<string, number> = {};

      applications?.forEach((app) => {
        const date = new Date(app.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      });

      // Convert to array and sort chronologically
      const monthlyData = Object.entries(monthCounts)
        .map(([monthKey, count]) => {
          const [year, month] = monthKey.split('-');
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return {
            month: `${monthNames[parseInt(month) - 1]} ${year}`,
            applications: count,
            sortKey: monthKey,
          };
        })
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
        .map(({ month, applications }) => ({ month, applications }));

      setData(monthlyData);
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#22A555] mx-auto mb-3" />
          <p className="text-sm text-gray-600">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22A555" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#22A555" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#d1d5db' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#d1d5db' }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            labelStyle={{ color: '#374151', fontWeight: 600 }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#6b7280' }}
          />
          <Line
            type="monotone"
            dataKey="applications"
            stroke="#22A555"
            strokeWidth={3}
            fill="url(#colorApplications)"
            dot={{ fill: '#22A555', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#22A555' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
