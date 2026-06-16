"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function TrendChart({
  data,
  valueKey,
  color = "#C9A86A"
}: {
  data: Array<Record<string, string | number>>;
  valueKey: string;
  color?: string;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${valueKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.36} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E3E7EE" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#667085", fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#667085", fontSize: 12 }} width={42} />
          <Tooltip
            contentStyle={{
              border: "1px solid #E3E7EE",
              borderRadius: 16,
              boxShadow: "0 16px 40px rgba(10,10,10,0.08)"
            }}
          />
          <Area type="monotone" dataKey={valueKey} stroke={color} strokeWidth={3} fill={`url(#gradient-${valueKey})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
