"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";

export function WorkloadChart({
  data,
}: {
  data: { name: string; students: number; capacity: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(43,38,32,0.08)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "#6b6355", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#6b6355", fontSize: 11 }} axisLine={false} tickLine={false} />
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
        <Bar dataKey="students" radius={[8, 8, 0, 0]} barSize={36}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.students > d.capacity ? "#DC2626" : d.students / d.capacity > 0.75 ? "#D97706" : "#4F5F31"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
