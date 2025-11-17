'use client';
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { supabase } from '@/lib/supabase/auth';
import { Loader2 } from 'lucide-react';

interface JobData {
  jobTitle: string;
  applications: number;
}

const COLORS = [
  '#22A555',  // Primary green
  '#3b82f6',  // Blue
  '#8b5cf6',  // Purple
  '#f59e0b',  // Orange
  '#ef4444',  // Red
  '#ec4899',  // Pink
  '#14b8a6',  // Teal
  '#6366f1',  // Indigo
];

export const JobMatchedChart: React.FC = () => {
  const [data, setData] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobData();
  }, []);

  const fetchJobData = async () => {
    try {
      // Optimized: Fetch from server-side aggregated API endpoint
      // This reduces data transfer from 10,000+ rows with JOINs to ~8-10 aggregated rows
      const response = await fetch('/api/hr/dashboard/charts?type=by-job');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch job data');
      }

      // Transform API response to chart format
      const jobData = result.data
        .slice(0, 8) // Top 8 jobs
        .map((item: { job_title: string; count: number }) => ({
          jobTitle: item.job_title.length > 30 ? item.job_title.substring(0, 30) + '...' : item.job_title,
          applications: item.count,
        }));

      setData(jobData);
    } catch (error) {
      console.error('Error fetching job data:', error);
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
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#d1d5db' }}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="jobTitle"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={{ stroke: '#d1d5db' }}
            width={95}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            labelStyle={{ color: '#374151', fontWeight: 600 }}
            cursor={{ fill: 'rgba(34, 165, 85, 0.1)' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#6b7280' }}
          />
          <Bar
            dataKey="applications"
            radius={[0, 8, 8, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
