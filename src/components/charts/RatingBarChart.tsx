// src/components/charts/RatingBarChart.tsx
'use client';

// --- START: useEffect, useState ကို import လုပ်ပါ ---
import { useEffect, useState } from 'react';
// --- END: useEffect, useState ကို import လုပ်ပါ ---
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Star } from 'lucide-react';

// Rating Stat အတွက် Type
type RatingStat = {
  rating_value: number;
  count: number;
};

// Recharts ရဲ့ Tooltip ကို စိတ်ကြိုက်ပြင်ဆင်ဖို့ Custom Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card-dark/80 backdrop-blur-sm p-3 rounded-md border border-border-color shadow-lg">
        <p className="font-bold text-yellow-400 flex items-center gap-1">
          {label} <Star size={14} fill="currentColor" />
        </p>
        <p className="text-sm text-text-dark-primary">
          Count: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

// ------------------------------
// --- ပင်မ Bar Chart Component ---
// ------------------------------
export default function RatingBarChart({ data }: { data: RatingStat[] | null }) {
  // --- START: Accent Color ကို CSS Variable ကနေ ဖတ်ယူရန် ---
  const [chartColor, setChartColor] = useState('#39FF14'); // Default green

  useEffect(() => {
    // Client-side မှာသာ document object ကို access လုပ်လို့ရမှာဖြစ်ပါတယ်။
    if (typeof window !== 'undefined') {
      const color = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent-color')
        .trim(); // .trim() က အရှေ့အနောက် space တွေ ပါလာရင် ဖယ်ရှားပေး
      
      // color က မရှိခဲ့ရင် (သို့) '' (empty string) ဖြစ်နေခဲ့ရင် default ကိုပဲ သုံး
      if (color) {
        setChartColor(color);
      } else {
        setChartColor('#39FF14'); // Default green
      }
    }
  }, [data]); // data ပြောင်းတိုင်း (tab ပြောင်းတိုင်း) အရောင်ကို ပြန်စစ်
  // --- END: Accent Color ကို CSS Variable ကနေ ဖတ်ယူရန် ---


  if (!data || data.every((d) => d.count === 0)) {
    return (
      <div className="text-center text-sm text-text-dark-secondary italic py-4">
        (No rating data yet. Rate some anime to see your stats!)
      </div>
    );
  }

  // --- START: Hardcode လုပ်ထားတဲ့ အရောင် logic ကို ဖယ်ရှားပါ ---
  // Accent color ကို CSS variable ကနေ ယူသုံးပါ
  // const accentColor =
  //   typeof window !== 'undefined'
  //     ? getComputedStyle(document.documentElement).getPropertyValue(
  //         '--accent-color'
  //       ) || '#39FF14'
  //     : '#39FF14';
  // --- END: Hardcode လုပ်ထားတဲ့ အရောင် logic ကို ဖယ်ရှားပါ ---

  return (
    <div className="mt-4" style={{ width: '100%', height: 250 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 0, // Phone မှာ ညာဘက် ကပ်မနေအောင်
            left: -30, // YAxis (ဂဏန်း) အတွက် နေရာ
            bottom: 0,
          }}
          barGap={4} // Bar တိုင်တွေကြားက space
        >
          {/* Chart နောက်ခံက မျဉ်းကြောင်းတွေ (မထည့်လည်း ရ၊ ထည့်ရင် ပိုလှ) */}
          <CartesianGrid
            strokeDasharray="3 3"
            strokeOpacity={0.1}
            stroke="#9CA3AF"
          />

          {/* X-axis (အောက်ခြေက 1, 2, 3... 10) */}
          <XAxis
            dataKey="rating_value"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: '#9CA3AF' }}
            interval={0} // 1-10 အကုန်ပြ
          />

          {/* Y-axis (ဘေးဘက်က အရေအတွက်) */}
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#9CA3AF' }}
            allowDecimals={false} // ဒသမ မပြ
            width={40}
          />

          {/* Tooltip (Mouse တင်ရင် ပေါ်လာမယ့် box) */}
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
          />

          {/* Bar တိုင်များ (chartColor state ကို သုံးပါ) */}
          <Bar dataKey="count" fill={chartColor} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}