import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../api/axios';
import Spinner from './ui/Spinner';

const EarningsChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const response = await api.get('/wallet/earnings-by-month');
        setData(response.data.data);
      } catch (err) {
        setError('Failed to load earnings data.');
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-card rounded-2xl border border-border/50">
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center bg-card rounded-2xl border border-border/50 text-destructive text-sm font-medium">
        {error}
      </div>
    );
  }

  return (
    <div className="h-64 w-full bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
      <h3 className="text-lg font-bold mb-4">Earnings Overview</h3>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 20,
            left: -20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `₹${value}`}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--secondary)/0.5)' }}
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              borderColor: 'hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--foreground))',
            }}
            itemStyle={{ color: 'hsl(var(--primary))' }}
            formatter={(value) => [`₹${value}`, 'Earnings']}
          />
          <Bar
            dataKey="amount"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
            barSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EarningsChart;
