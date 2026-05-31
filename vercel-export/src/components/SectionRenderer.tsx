import React from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { DynamicTable } from "@/components/DynamicTable";
import {
  Star, AlertTriangle, TrendingUp, CheckCircle2,
  Users, XCircle, BarChart2, Layers, ArrowRight
} from "lucide-react";

interface SectionRendererProps {
  id: string;
  label: string;
  icon: React.ElementType;
  data: any;
  delay?: number;
}

const ChartTooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
  color: "hsl(var(--foreground))",
};

const toArr = (v: any): any[] =>
  Array.isArray(v) ? v : v && typeof v === "object" ? Object.values(v) : [];

function StatPill({ label, value, color = "bg-secondary/60 text-foreground" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className={`flex flex-col items-center px-4 py-3 rounded-xl border border-border/60 ${color} min-w-[80px]`}>
      <span className="text-xl font-display font-bold leading-tight">{value}</span>
      <span className="text-[10px] font-medium text-muted-foreground mt-0.5 uppercase tracking-wide">{label}</span>
    </div>
  );
}

function MiniKPICard({ label, value, color = "bg-secondary/40" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className={`rounded-xl p-4 border border-border/50 flex flex-col gap-1 ${color}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-2xl font-display font-bold leading-tight">{value}</span>
    </div>
  );
}

function AttendanceSection({ data }: { data: any[] }) {
  const totalPresent = data.reduce((s, r) => s + (Number(r?.Present) || 0), 0);
  const totalAbsent = data.reduce((s, r) => s + (Number(r?.Absent) || 0), 0);
  const totalStudents = totalPresent + totalAbsent;
  const overallPct = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;
  const lowAttendance = data.filter((r) => Number(r?.["Attendance %"]) < 85);
  const highAttendance = data.filter((r) => Number(r?.["Attendance %"]) >= 90);

  const chartData = data.map((r) => ({
    name: r?.Batch ?? "—",
    present: Number(r?.Present) || 0,
    absent: Number(r?.Absent) || 0,
    pct: Number(r?.["Attendance %"]) || 0,
  }));

  return (
    <div className="space-y-5">
      {lowAttendance.length > 0 && (
        <div className="flex items-start gap-3 p-3.5 bg-red-500/8 border border-red-200 dark:border-red-900/40 rounded-xl text-sm">
          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">Low Attendance Alert</p>
            <p className="text-red-600/80 dark:text-red-400/70 text-xs mt-0.5">
              {lowAttendance.map((r) => `${r?.Batch} (${r?.["Attendance %"]}%)`).join(" · ")} — below 85% threshold
            </p>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <StatPill label="Overall" value={`${overallPct}%`} color={overallPct >= 90 ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30" : overallPct >= 80 ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30" : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30"} />
        <StatPill label="Present" value={totalPresent} color="bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30" />
        <StatPill label="Absent" value={totalAbsent} color="bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30" />
        <StatPill label="Batches" value={data.length} />
        <StatPill label="Above 90%" value={highAttendance.length} color="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30" />
        <StatPill label="Below 85%" value={lowAttendance.length} color={lowAttendance.length > 0 ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30" : "bg-secondary/60 text-foreground"} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Attendance % by Batch</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-40} textAnchor="end" interval={0} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={ChartTooltipStyle} formatter={(v: any) => [`${v}%`, "Attendance"]} />
              <Bar dataKey="pct" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {chartData.map((d, i) => <Cell key={i} fill={d.pct < 80 ? "#ef4444" : d.pct < 90 ? "#f59e0b" : "#10b981"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Present vs Absent by Batch</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-40} textAnchor="end" interval={0} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={ChartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="present" name="Present" fill="#10b981" stackId="a" maxBarSize={40} />
              <Bar dataKey="absent" name="Absent" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <DynamicTable data={data} sectionName="Attendance" />
    </div>
  );
}

function SessionSection({ data }: { data: any[] }) {
  const sorted = [...data].sort((a, b) => (Number(b?.["Instructor Rating"]) || 0) - (Number(a?.["Instructor Rating"]) || 0));
  const topInstructor = sorted[0];
  const totalPlanned = data.reduce((s, r) => s + (Number(r?.["Session Planned"]) || 0), 0);
  const totalCompleted = data.reduce((s, r) => s + (Number(r?.["Session Completed"]) || 0), 0);
  const sessionRate = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;
  const delayed = data.filter((r) => r?.Status?.toLowerCase() === "delayed");
  const avgInstRating = data.length > 0 ? (data.reduce((s, r) => s + (Number(r?.["Instructor Rating"]) || 0), 0) / data.length).toFixed(1) : "—";
  const avgSessRating = data.length > 0 ? (data.reduce((s, r) => s + (Number(r?.["Session Rating"]) || 0), 0) / data.length).toFixed(1) : "—";

  return (
    <div className="space-y-5">
      {delayed.length > 0 && (
        <div className="flex items-start gap-3 p-3.5 bg-red-500/8 border border-red-200 dark:border-red-900/40 rounded-xl text-sm">
          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">Delayed Sessions</p>
            <p className="text-red-600/80 dark:text-red-400/70 text-xs mt-0.5">
              {delayed.map((r) => `${r?.Batch}${r?.["Delay Reason"] ? ` — ${r?.["Delay Reason"]}` : ""}`).join(" · ")}
            </p>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-3 items-start">
        {topInstructor && (
          <div className="flex items-center gap-4 p-4 bg-amber-500/8 border border-amber-200 dark:border-amber-900/40 rounded-xl flex-1 min-w-[220px]">
            <div className="h-11 w-11 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
            </div>
            <div>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Top Instructor</p>
              <p className="font-bold text-base">{topInstructor?.Instructor}</p>
              <p className="text-xs text-muted-foreground">{topInstructor?.Batch} · Rating {topInstructor?.["Instructor Rating"]}/5</p>
            </div>
          </div>
        )}
        <StatPill label="Sessions %" value={`${sessionRate}%`} color={sessionRate >= 90 ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30" : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30"} />
        <StatPill label="Completed" value={totalCompleted} color="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30" />
        <StatPill label="Planned" value={totalPlanned} />
        <StatPill label="Avg Inst. Rating" value={avgInstRating} color="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30" />
        <StatPill label="Avg Sess. Rating" value={avgSessRating} color="bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-900/30" />
        <StatPill label="Delayed" value={delayed.length} color={delayed.length > 0 ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30" : "bg-secondary/60 text-foreground"} />
      </div>
      <DynamicTable data={data} sectionName="Session Delivery" />
    </div>
  );
}

function CleaningSection({ data }: { data: any[] }) {
  const areas = Array.from(new Set(data.map((r) => r?.Area))).filter(Boolean) as string[];
  const timeSlots = Array.from(new Set(data.map((r) => r?.["Time Slot"]))).filter(Boolean) as string[];
  const done = data.filter((r) => r?.Status?.toLowerCase() === "done").length;
  const pending = data.filter((r) => r?.Status?.toLowerCase() === "pending").length;
  const delayed = data.filter((r) => r?.Status?.toLowerCase() === "delayed").length;
  const totalPct = data.length > 0 ? Math.round((done / data.length) * 100) : 0;

  const matrix: Record<string, Record<string, string>> = {};
  data.forEach((r) => {
    const area = r?.Area;
    const slot = r?.["Time Slot"];
    if (area && slot) {
      if (!matrix[area]) matrix[area] = {};
      matrix[area][slot] = r?.Status ?? "—";
    }
  });

  const statusIcon = (status: string) => {
    const s = String(status).toLowerCase();
    if (s === "done") return "✔";
    if (s === "pending") return "✖";
    if (s === "delayed") return "⚠";
    return "—";
  };

  const statusCls = (status: string) => {
    const s = String(status).toLowerCase();
    if (s === "done") return "text-green-600 dark:text-green-400 font-bold text-base";
    if (s === "pending") return "text-red-600 dark:text-red-400 font-bold text-base";
    if (s === "delayed") return "text-amber-600 dark:text-amber-400 font-bold text-base";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <StatPill label="Completion" value={`${totalPct}%`} color={totalPct === 100 ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30" : totalPct >= 75 ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30" : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30"} />
        <StatPill label="Done" value={done} color="bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30" />
        <StatPill label="Pending" value={pending} color={pending > 0 ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30" : "bg-secondary/60 text-foreground"} />
        <StatPill label="Delayed" value={delayed} color={delayed > 0 ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30" : "bg-secondary/60 text-foreground"} />
        <StatPill label="Areas" value={areas.length} />
      </div>
      {areas.length > 0 && timeSlots.length > 0 && (
        <div className="glass-card rounded-2xl p-5 overflow-x-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Cleaning Status Matrix</p>
          <table className="w-full text-sm border-collapse min-w-[360px]">
            <thead>
              <tr>
                <th className="text-left font-semibold text-muted-foreground py-2 pr-6 text-xs border-b border-border/50">Area</th>
                {timeSlots.map((slot) => (
                  <th key={slot} className="text-center font-semibold text-muted-foreground py-2 px-4 text-xs border-b border-border/50 whitespace-nowrap">{slot}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {areas.map((area, i) => (
                <tr key={area} className={i % 2 === 0 ? "bg-secondary/20" : ""}>
                  <td className="font-medium py-2.5 pr-6 text-xs whitespace-nowrap">{area}</td>
                  {timeSlots.map((slot) => {
                    const status = matrix[area]?.[slot] ?? "—";
                    return (
                      <td key={slot} className={`text-center py-2.5 px-4 ${statusCls(status)}`} title={status}>
                        {statusIcon(status)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-5 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="text-green-600 dark:text-green-400 font-bold">✔</span> Done</span>
            <span className="flex items-center gap-1.5"><span className="text-red-600 dark:text-red-400 font-bold">✖</span> Pending</span>
            <span className="flex items-center gap-1.5"><span className="text-amber-600 dark:text-amber-400 font-bold">⚠</span> Delayed</span>
          </div>
        </div>
      )}
    </div>
  );
}

function InfraSection({ data }: { data: any[] }) {
  const delayed = data.filter((r) => r?.Status?.toLowerCase() === "delayed");
  const completed = data.filter((r) => r?.Status?.toLowerCase() === "completed");
  const inProgress = data.filter((r) => r?.Status?.toLowerCase() === "in progress" || r?.Status?.toLowerCase() === "in-progress");
  const blocked = data.filter((r) => r?.Blocker && !["none", "no blocker", "n/a", ""].includes((r?.Blocker ?? "").toLowerCase()));

  return (
    <div className="space-y-5">
      {delayed.length > 0 && (
        <div className="flex items-start gap-3 p-3.5 bg-red-500/8 border border-red-200 dark:border-red-900/40 rounded-xl text-sm">
          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">Delayed Items</p>
            <p className="text-red-600/80 dark:text-red-400/70 text-xs mt-0.5">{delayed.map((r) => r?.["Work Item"]).join(" · ")}</p>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <StatPill label="Total Items" value={data.length} />
        <StatPill label="Completed" value={completed.length} color="bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30" />
        <StatPill label="In Progress" value={inProgress.length} color="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30" />
        <StatPill label="Delayed" value={delayed.length} color={delayed.length > 0 ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30" : "bg-secondary/60 text-foreground"} />
        <StatPill label="Blocked" value={blocked.length} color={blocked.length > 0 ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30" : "bg-secondary/60 text-foreground"} />
      </div>
      <DynamicTable data={data} sectionName="Infrastructure" />
    </div>
  );
}

function AssessmentSection({ data }: { data: any[] }) {
  if (data.length === 0) return null;
  const allBands = [
    { label: "Above 80", key: "Above 80", color: "#10b981" },
    { label: "70–80", key: "70-80", color: "#3b82f6" },
    { label: "60–70", key: "60-70", color: "#f59e0b" },
    { label: "50–60", key: "50-60", color: "#f97316" },
    { label: "Below 50", key: "Below 50", color: "#ef4444" },
    { label: "Absent", key: "Absent", color: "#94a3b8" },
  ];
  const bandTotals = allBands.map((b) => ({ ...b, value: data.reduce((s, r) => s + (Number(r[b.key]) || 0), 0) })).filter((b) => b.value > 0);
  const total = bandTotals.reduce((s, d) => s + d.value, 0);
  const abovePassing = bandTotals.filter((b) => ["Above 80", "70–80", "60–70"].includes(b.label)).reduce((s, b) => s + b.value, 0);
  const passingRate = total > 0 ? Math.round((abovePassing / total) * 100) : 0;
  const batchData = data.map((r) => {
    const row: any = { name: r?.Batch ?? r?.Assessment ?? "Batch" };
    allBands.forEach((b) => { row[b.label] = Number(r[b.key]) || 0; });
    return row;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <StatPill label="Total Students" value={total} />
        <StatPill label="Passing (≥60%)" value={abovePassing} color="bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30" />
        <StatPill label="Pass Rate" value={`${passingRate}%`} color={passingRate >= 80 ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30" : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30"} />
        <StatPill label="Batches" value={data.length} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Score Band Distribution</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={bandTotals} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value" nameKey="label">
                  {bandTotals.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={ChartTooltipStyle} formatter={(v: any) => [v, "Students"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2.5 flex-1">
              {bandTotals.map((b) => (
                <div key={b.label} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: b.color }} />
                  <span className="text-sm flex-1 text-muted-foreground">{b.label}</span>
                  <span className="font-bold text-sm">{b.value}</span>
                  <span className="text-xs text-muted-foreground w-9 text-right">{total > 0 ? Math.round((b.value / total) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {data.length > 1 ? (
          <div className="glass-card rounded-2xl p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Score Bands by Batch</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={batchData} margin={{ top: 4, right: 4, left: -24, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-35} textAnchor="end" interval={0} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={ChartTooltipStyle} />
                {allBands.map((b) => <Bar key={b.label} dataKey={b.label} stackId="a" fill={b.color} maxBarSize={40} />)}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Band-wise Breakdown</p>
            <div className="space-y-3">
              {bandTotals.map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-sm shrink-0" style={{ background: b.color }} />
                  <span className="text-sm flex-1">{b.label}</span>
                  <span className="font-bold">{b.value}</span>
                  <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${total > 0 ? (b.value / total) * 100 : 0}%`, background: b.color }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">{total > 0 ? Math.round((b.value / total) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <DynamicTable data={data} sectionName="Assessments" />
    </div>
  );
}

function EscalationsSection({ data }: { data: any[] }) {
  const open = data.filter((r) => r?.Status?.toLowerCase() === "open");
  const resolved = data.filter((r) => r?.Status?.toLowerCase() === "resolved");
  const inProgress = data.filter((r) => !["open", "resolved"].includes(r?.Status?.toLowerCase() ?? ""));
  const categories = Array.from(new Set(data.map((r) => r?.Category))).filter(Boolean) as string[];

  return (
    <div className="space-y-5">
      {open.length > 0 && (
        <div className="flex items-start gap-3 p-3.5 bg-red-500/8 border border-red-200 dark:border-red-900/40 rounded-xl text-sm">
          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">{open.length} Open Escalation{open.length > 1 ? "s" : ""} — Immediate Attention Required</p>
            <p className="text-red-600/80 dark:text-red-400/70 text-xs mt-0.5">{open.map((r) => r?.Issue).join(" · ")}</p>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <StatPill label="Total" value={data.length} />
        <StatPill label="Open" value={open.length} color={open.length > 0 ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30" : "bg-secondary/60 text-foreground"} />
        <StatPill label="In Progress" value={inProgress.length} color="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30" />
        <StatPill label="Resolved" value={resolved.length} color="bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30" />
        <StatPill label="Categories" value={categories.length} />
      </div>
      <DynamicTable data={data} sectionName="Escalations" />
    </div>
  );
}

function PlacementsSection({ data }: { data: any[] }) {
  const today = new Date();
  const totalShared = data.reduce((s, r) => s + (Number(r?.["Shared To Students"]) || 0), 0);
  const totalApplied = data.reduce((s, r) => s + (Number(r?.Applied) || 0), 0);
  const applicationRate = totalShared > 0 ? Math.round((totalApplied / totalShared) * 100) : 0;
  const urgent = data.filter((r) => {
    if (!r?.Deadline) return false;
    try {
      const [d, m, y] = String(r?.Deadline).split("-");
      return (new Date(`${y}-${m}-${d}`).getTime() - today.getTime()) / 86400000 <= 2;
    } catch { return false; }
  });
  const funnelData = [
    { name: "Opportunities", value: data.length, color: "#3b82f6" },
    { name: "Shared to Students", value: totalShared, color: "#8b5cf6" },
    { name: "Applied", value: totalApplied, color: "#10b981" },
  ];
  const companyData = data.map((r) => ({ name: r?.Company ?? "—", shared: Number(r?.["Shared To Students"]) || 0, applied: Number(r?.Applied) || 0 }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniKPICard label="Opportunities Shared" value={totalShared} color="bg-blue-500/8" />
        <MiniKPICard label="Total Applications" value={totalApplied} color="bg-violet-500/8" />
        <MiniKPICard label="Active Opportunities" value={data.length} color="bg-orange-500/8" />
        <MiniKPICard label="Application Rate" value={`${applicationRate}%`} color="bg-green-500/8" />
      </div>
      {urgent.length > 0 && (
        <div className="flex items-start gap-3 p-3.5 bg-red-500/8 border border-red-200 dark:border-red-900/40 rounded-xl text-sm">
          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">Urgent Deadlines (≤2 days)</p>
            <p className="text-red-600/80 dark:text-red-400/70 text-xs mt-0.5">{urgent.map((r) => `${r?.Company} (${r?.Deadline})`).join(" · ")}</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Placement Funnel</p>
          <div className="space-y-3">
            {funnelData.map((f, i) => (
              <div key={f.name} className="flex items-center gap-3">
                {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 -mt-3 ml-1" />}
                {i === 0 && <div className="w-4 shrink-0" />}
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-muted-foreground">{f.name}</span>
                    <span className="font-bold">{f.value}</span>
                  </div>
                  <div className="h-5 bg-secondary/60 rounded-full overflow-hidden">
                    <div className="h-full rounded-full flex items-center justify-end pr-2" style={{ width: `${funnelData[0].value > 0 ? Math.min(100, (f.value / funnelData[0].value) * 100) : 0}%`, background: f.color }}>
                      {funnelData[0].value > 0 && (f.value / funnelData[0].value) * 100 > 15 && (
                        <span className="text-[10px] text-white font-bold">{Math.round((f.value / funnelData[0].value) * 100)}%</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Shared vs Applied by Company</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={companyData} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={80} />
              <Tooltip contentStyle={ChartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="shared" name="Shared" fill="#94a3b8" radius={[0, 2, 2, 0]} maxBarSize={14} />
              <Bar dataKey="applied" name="Applied" fill="#8b5cf6" radius={[0, 2, 2, 0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <DynamicTable data={data} sectionName="Placements" />
    </div>
  );
}

function CRTSection({ data }: { data: any[] }) {
  const totalApplied = data.reduce((s, r) => s + (Number(r?.Applied) || 0), 0);
  const totalShortlisted = data.reduce((s, r) => s + (Number(r?.Shortlisted) || 0), 0);
  const totalAttended = data.reduce((s, r) => s + (Number(r?.["CRT Attended"]) || 0), 0);
  const attendRate = totalApplied > 0 ? Math.round((totalAttended / totalApplied) * 100) : 0;
  const funnelData = [
    { name: "Applied", value: totalApplied, color: "#3b82f6" },
    { name: "Shortlisted", value: totalShortlisted, color: "#8b5cf6" },
    { name: "Attended CRT", value: totalAttended, color: "#10b981" },
  ];
  const companyBar = data.map((r) => ({
    name: r?.Company ?? "—",
    applied: Number(r?.Applied) || 0,
    shortlisted: Number(r?.Shortlisted) || 0,
    attended: Number(r?.["CRT Attended"]) || 0,
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniKPICard label="Total Applied" value={totalApplied} color="bg-blue-500/8" />
        <MiniKPICard label="Shortlisted" value={totalShortlisted} color="bg-violet-500/8" />
        <MiniKPICard label="CRT Attended" value={totalAttended} color="bg-green-500/8" />
        <MiniKPICard label="Attendance Rate" value={`${attendRate}%`} color="bg-amber-500/8" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">CRT Pipeline</p>
          <div className="space-y-3">
            {funnelData.map((f, i) => (
              <div key={f.name} className="flex items-center gap-3">
                {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 -mt-3 ml-1" />}
                {i === 0 && <div className="w-4 shrink-0" />}
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-muted-foreground">{f.name}</span>
                    <span className="font-bold">{f.value}</span>
                  </div>
                  <div className="h-5 bg-secondary/60 rounded-full overflow-hidden">
                    <div className="h-full rounded-full flex items-center justify-end pr-2" style={{ width: `${funnelData[0].value > 0 ? Math.min(100, (f.value / funnelData[0].value) * 100) : 0}%`, background: f.color }}>
                      {funnelData[0].value > 0 && (f.value / funnelData[0].value) * 100 > 15 && (
                        <span className="text-[10px] text-white font-bold">{Math.round((f.value / funnelData[0].value) * 100)}%</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">CRT Pipeline by Company</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={companyBar} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={80} />
              <Tooltip contentStyle={ChartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="applied" name="Applied" fill="#3b82f6" radius={[0, 2, 2, 0]} maxBarSize={10} />
              <Bar dataKey="shortlisted" name="Shortlisted" fill="#8b5cf6" radius={[0, 2, 2, 0]} maxBarSize={10} />
              <Bar dataKey="attended" name="Attended" fill="#10b981" radius={[0, 2, 2, 0]} maxBarSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <DynamicTable data={data} sectionName="CRT" />
    </div>
  );
}

function GenericSection({ data, label }: { data: any; label: string }) {
  const rows = toArr(data);
  return (
    <div className="space-y-5">
      {rows.length > 0 && <div className="flex flex-wrap gap-3"><StatPill label="Records" value={rows.length} /></div>}
      <DynamicTable data={data} sectionName={label} />
    </div>
  );
}

export function SectionRenderer({ id, label, icon: Icon, data, delay = 0 }: SectionRendererProps) {
  const rows = toArr(data);

  const renderContent = () => {
    if (!rows.length) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center glass-card rounded-2xl">
          <BarChart2 className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm font-medium">No data available for {label}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Select a different date or date range to view records</p>
        </div>
      );
    }
    switch (id.toLowerCase()) {
      case "attendance": return <AttendanceSection data={rows} />;
      case "session_delivery": return <SessionSection data={rows} />;
      case "cleaning": return <CleaningSection data={rows} />;
      case "infrastructure": return <InfraSection data={rows} />;
      case "assessments": return <AssessmentSection data={rows} />;
      case "escalations": return <EscalationsSection data={rows} />;
      case "placements": return <PlacementsSection data={rows} />;
      case "crt": return <CRTSection data={rows} />;
      default: return <GenericSection data={data} label={label} />;
    }
  };

  return (
    <motion.section
      id={id}
      className="space-y-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center gap-3 pb-2 border-b border-border/50">
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <h2 className="font-display font-bold text-xl tracking-tight">{label}</h2>
        {rows.length > 0 && (
          <span className="text-xs text-muted-foreground bg-secondary/60 px-2.5 py-0.5 rounded-full font-medium">
            {rows.length} {rows.length === 1 ? "record" : "records"}
          </span>
        )}
      </div>
      {renderContent()}
    </motion.section>
  );
}
