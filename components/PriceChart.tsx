'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PriceDataPoint {
  time: string;
  price: number;
  createdAt: Date;
}

interface PriceChartProps {
  data: PriceDataPoint[];
}

export function PriceChart({ data }: PriceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 bg-gradient-to-br from-purple-50 to-pink-50 rounded flex items-center justify-center">
        <p className="text-gray-500">
          No price history yet. Run the market tick to start tracking prices!
        </p>
      </div>
    );
  }

  // Format data for the chart
  const chartData = data.map((point) => ({
    time: new Date(point.createdAt).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
    price: point.price,
    fullDate: new Date(point.createdAt).toLocaleString(),
  }));

  // Calculate min/max for Y axis domain
  const prices = chartData.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.1 || 0.1; // 10% padding

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            domain={[minPrice - padding, maxPrice + padding]}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                    <p className="text-xs text-gray-600">{payload[0].payload.fullDate}</p>
                    <p className="text-lg font-bold text-purple-600">
                      ${Number(payload[0].value).toFixed(2)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#9333ea"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: '#9333ea' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
