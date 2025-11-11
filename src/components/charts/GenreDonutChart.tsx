// src/components/charts/GenreDonutChart.tsx
'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { BarChart2 } from 'lucide-react';

// Genre Stat အတွက် Type
type GenreStat = {
  genre_name: string;
  count: number;
};

// Chart မှာ သုံးမယ့် အရောင်တွေ (Tailwind CSS အရောင်တွေနဲ့ နီးစပ်အောင် ယူထား)
const COLORS = [
  '#39FF14', // accent-green
  '#A78BFA', // accent-purple
  '#60A5FA', // accent-blue
  '#FBBF24', // amber-400
  '#EC4899', // pink-500
  '#14B8A6', // teal-500
  '#F87171', // red-400
  '#F97316', // orange-500
  '#8B5CF6', // violet-500
  '#06B6D4', // cyan-500
];

// Recharts ရဲ့ Legend ကို စိတ်ကြိုက်ပြင်ဆင်ဖို့ Custom Component
const CustomLegend = (props: any) => {
  const { payload } = props;
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-text-dark-secondary list-none p-0 mt-3">
      {payload.map((entry: any, index: number) => (
        <li
          key={`item-${index}`}
          className="flex items-center"
          style={{ color: entry.color }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full mr-1.5"
            style={{ backgroundColor: entry.color }}
          ></span>
          {entry.value} ({entry.payload.percent.toFixed(0)}%)
        </li>
      ))}
    </ul>
  );
};

// Recharts ရဲ့ Tooltip ကို စိတ်ကြိုက်ပြင်ဆင်ဖို့ Custom Component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card-dark/80 backdrop-blur-sm p-3 rounded-md border border-border-color shadow-lg">
        <p className="font-bold" style={{ color: data.fill }}>
          {data.genre_name}
        </p>
        <p className="text-sm text-text-dark-primary">
          Count: {data.count}
        </p>
        <p className="text-sm text-text-dark-secondary">
          Percentage: {data.percent.toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

// ------------------------------
// --- ပင်မ Donut Chart Component ---
// ------------------------------
export default function GenreDonutChart({ data }: { data: GenreStat[] | null }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-sm text-text-dark-secondary italic py-4">
        (No genre data yet. Start watching anime to build your stats!)
      </div>
    );
  }

  // ရာခိုင်နှုန်း တွက်ချက်ခြင်း
  const totalCount = data.reduce((acc, entry) => acc + entry.count, 0);
  const chartData = data.map((entry) => ({
    ...entry,
    percent: (entry.count / totalCount) * 100,
  }));

  return (
    <div className="mt-4" style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {/* Tooltip (Mouse တင်ရင် ပေါ်လာမယ့် box) */}
          <Tooltip content={<CustomTooltip />} />

          {/* Legend (အောက်က အရောင်နဲ့ စာသားလေးတွေ) */}
          <Legend content={<CustomLegend />} wrapperStyle={{ paddingTop: 10 }} />

          {/* Donut Chart (Pie) */}
          <Pie
            data={chartData}
            cx="50%" // အလယ်
            cy="50%" // အလယ်
            dataKey="count"
            nameKey="genre_name"
            innerRadius={60} // အတွင်းအပေါက် (Donut ဖြစ်အောင်)
            outerRadius={90} // အပြင်အဝိုင်း
            paddingAngle={2} // အတုံးလေးတွေကြားက အဖြူရောင် space
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                className="focus:outline-none transition-opacity"
                style={{ opacity: 0.8 }}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}