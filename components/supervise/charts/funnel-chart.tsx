"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#2D3A1B", "#3E4C26", "#4F5F31", "#5F723C", "#7C8B54", "#A9BD82", "#C7D6A8", "#DFE9CB"];

export function FunnelChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical" margin={{ left: 24, right: 24, top: 8, bottom: 8 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fill: "#6b6355", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(43,38,32,0.04)" }}
          contentStyle={{
            background: "rgba(43,38,32,0.95)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            color: "white",
            fontSize: 12,
          }}
        />
        <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={22}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
