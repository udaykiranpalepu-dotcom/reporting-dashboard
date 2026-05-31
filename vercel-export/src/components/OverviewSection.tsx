import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import {
  Users, CheckCircle2, AlertTriangle, Briefcase, Sparkles,
  BookOpen, Target, TrendingUp, TrendingDown, Minus, HeartPulse, Zap
} from "lucide-react";

interface Props {
  data: Record<string, any>;
  dateLabel: string;
}

const toArr = (v: any): any[] => (Array.isArray(v) ? v : []);

function normalise(data: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) out[k.toLowerCase()] = v;
  return out;
}

function computeKPIs(data: Record<string, any>) {
  const d = normalise(data);
  const attendance = toArr(d.attendance);
  const sessions = toArr(d.session_delivery);
  const cleaning = toArr(d.cleaning);
  const escalations = toArr(d.escalations);
  const placements = toArr(d.placements);
  const crt = toArr(d.crt);
  const studentPulse = toArr(d.student_pulse);
  const aiAdoption = toArr(d.ai_adoption);

  const totalPresent = attendance.reduce((s, r) => s + (Number(r?.Present) || 0), 0);
  const totalAbsent = attendance.reduce((s, r) => s + (Number(r?.Absent) || 0), 0);
  const totalStudents = totalPresent + totalAbsent;
  const attendancePct = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;

  const sessionsPlanned = sessions.reduce((s, r) => s + (Number(r?.["Session Planned"]) || 0), 0);
  const sessionsCompleted = sessions.reduce((s, r) => s + (Number(r?.["Session Completed"]) || 0), 0);
  const sessionRate = sessionsPlanned > 0 ? Math.round((sessionsCompleted / sessionsPlanned) * 100) : 0;

  const cleaningDone = cleaning.filter((r) => r?.Status?.toLowerCase() === "done").length;
  const cleaningPct = cleaning.length > 0 ? Math.round((cleaningDone / cleaning.length) * 100) : 0;

  const openEscalations = escalations.filter((r) => r?.Status?.toLowerCase() === "open").length;
  const resolvedEscalations = escalations.filter((r) => r?.Status?.toLowerCase() === "resolved").length;

  const totalApplied = placements.reduce((s, r) => s + (Number(r?.Applied) || 0), 0);

  const totalCRTApplied = crt.reduce((s, r) => s + (Number(r?.Applied) || 0), 0);
  const totalShortlisted = crt.reduce((s, r) => s + (Number(r?.Shortlisted) || 0), 0);
  const totalCRTAttended = crt.reduce((s, r) => s + (Number(r?.["CRT Attended"]) || 0), 0);
  const crtParticipationRate = totalCRTApplied > 0 ? Math.round((totalCRTAttended / totalCRTApplied) * 100) : 0;
  const crtCompleted = crt.filter((r) => r?.Completed?.toLowerCase() === "yes").length;

  const pulsePositive = studentPulse.filter((r) => String(r?.Sentiment ?? "").toLowerCase().includes("positive")).length;
  const pulseNeutral = studentPulse.filter((r) => String(r?.Sentiment ?? "").toLowerCase().includes("neutral")).length;
  const pulseNegative = studentPulse.filter((r) => String(r?.Sentiment ?? "").toLowerCase().includes("negative")).length;
  const engagementVals = studentPulse.map((r) => Number(r?.Engagement) || 0).filter((v) => v > 0);
  const engagementAvg = engagementVals.length > 0 ? Math.round(engagementVals.reduce((s, v) => s + v, 0) / engagementVals.length) : 0;

  const aiUsagePct = (() => {
    if (aiAdoption.length === 0) return 0;
    for (const k of ["AI Usage %", "Adoption %", "Adoption Rate", "Usage %", "AI Adoption %"]) {
      const vals = aiAdoption.map((r: any) => Number(r?.[k]) || 0).filter((v: number) => v > 0);
      if (vals.length > 0) return Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length);
    }
    return 0;
  })();

  const avgInstructorRating =
    sessions.length > 0
      ? sessions.reduce((s, r) => s + (Number(r?.["Instructor Rating"]) || 0), 0) / sessions.length
      : 0;

  return {
    attendancePct, totalPresent, totalAbsent, totalStudents,
    sessionsCompleted, sessionsPlanned, sessionRate,
    cleaningPct, cleaningDone, cleaningTotal: cleaning.length,
    openEscalations, resolvedEscalations,
    placementCount: placements.length, totalApplied,
    crtTotal: crt.length, crtCompleted,
    totalCRTApplied, totalShortlisted, totalCRTAttended, crtParticipationRate,
    pulsePositive, pulseNeutral, pulseNegative, engagementAvg,
    aiUsagePct, aiRecords: aiAdoption.length,
    avgInstructorRating: Math.round(avgInstructorRating * 10) / 10,
    batchCount: attendance.length,
  };
}

function generateSummary(kpis: ReturnType<typeof computeKPIs>): string {
  const parts: string[] = [];
  if (kpis.attendancePct > 0)
    parts.push(`Attendance is at ${kpis.attendancePct}% across ${kpis.batchCount} batches (${kpis.totalPresent} present, ${kpis.totalAbsent} absent).`);
  if (kpis.sessionRate > 0)
    parts.push(`Sessions: ${kpis.sessionRate}% delivered (${kpis.sessionsCompleted}/${kpis.sessionsPlanned}).`);
  if (kpis.cleaningPct > 0)
    parts.push(`Cleaning: ${kpis.cleaningPct}% complete.`);
  if (kpis.openEscalations > 0)
    parts.push(`${kpis.openEscalations} escalation${kpis.openEscalations > 1 ? "s" : ""} require immediate attention.`);
  else if (kpis.resolvedEscalations > 0)
    parts.push("All escalations resolved.");
  if (kpis.placementCount > 0)
    parts.push(`Placements: ${kpis.placementCount} opportunit${kpis.placementCount > 1 ? "ies" : "y"} active, ${kpis.totalApplied} applications.`);
  if (kpis.crtParticipationRate > 0)
    parts.push(`CRT participation: ${kpis.crtParticipationRate}% (${kpis.totalCRTAttended} attended).`);
  if (kpis.pulsePositive + kpis.pulseNeutral + kpis.pulseNegative > 0)
    parts.push(`Student pulse: ${kpis.pulsePositive} positive, ${kpis.pulseNeutral} neutral, ${kpis.pulseNegative} negative.`);
  if (kpis.aiUsagePct > 0)
    parts.push(`AI adoption: ${kpis.aiUsagePct}%.`);
  if (parts.length === 0)
    parts.push("Operations data loaded. Select a date or date range to view metrics.");
  return parts.join(" ");
}

const ChartTooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
  color: "hsl(var(--foreground))",
};

const KPICard = ({
  label, value, unit = "", icon: Icon, color, trend, subtitle, delay = 0,
}: {
  label: string; value: number | string; unit?: string; icon: React.ElementType;
  color: string; trend?: "up" | "down" | "neutral"; subtitle?: string; delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    className="glass-card rounded-2xl p-4 flex flex-col gap-2.5 hover:shadow-md transition-shadow duration-200 cursor-default"
  >
    <div className="flex items-start justify-between">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider leading-tight pr-2">{label}</p>
      <div className={`h-7 w-7 shrink-0 rounded-lg flex items-center justify-center bg-gradient-to-br ${color} shadow-sm`}>
        <Icon className="h-3.5 w-3.5 text-white" />
      </div>
    </div>
    <div>
      <div className="text-2xl font-display font-bold tracking-tight text-foreground flex items-end gap-1">
        {typeof value === "number" ? <AnimatedCounter value={value} /> : value}
        {unit && <span className="text-base text-muted-foreground font-medium">{unit}</span>}
      </div>
      {subtitle && (
        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
          {trend === "up" && <TrendingUp className="h-3 w-3 text-green-500 shrink-0" />}
          {trend === "down" && <TrendingDown className="h-3 w-3 text-red-500 shrink-0" />}
          {trend === "neutral" && <Minus className="h-3 w-3 text-muted-foreground shrink-0" />}
          <span className="truncate">{subtitle}</span>
        </p>
      )}
    </div>
  </motion.div>
);

export function OverviewSection({ data, dateLabel }: Props) {
  const nd = normalise(data);
  const kpis = useMemo(() => computeKPIs(data), [data]);
  const summary = useMemo(() => generateSummary(kpis), [kpis]);

  const attendanceChartData = useMemo(
    () => toArr(nd.attendance).map((r) => ({ name: r?.Batch ?? "Unknown", pct: Number(r?.["Attendance %"]) || 0 })),
    [nd.attendance]
  );

  const sessionChartData = useMemo(
    () => toArr(nd.session_delivery).map((r) => ({
      name: r?.Batch ?? "Unknown",
      planned: Number(r?.["Session Planned"]) || 0,
      completed: Number(r?.["Session Completed"]) || 0,
    })),
    [nd.session_delivery]
  );

  const escalationDonut = useMemo(() => {
    const esc = toArr(nd.escalations);
    const open = esc.filter((r) => r?.Status?.toLowerCase() === "open").length;
    const resolved = esc.filter((r) => r?.Status?.toLowerCase() === "resolved").length;
    const inprogress = esc.length - open - resolved;
    return [
      { name: "Open", value: open, color: "#ef4444" },
      { name: "Resolved", value: resolved, color: "#10b981" },
      { name: "In Progress", value: inprogress > 0 ? inprogress : 0, color: "#f59e0b" },
    ].filter((d) => d.value > 0);
  }, [nd.escalations]);

  const kpiCards = [
    { label: "Attendance Rate", value: kpis.attendancePct, unit: "%", icon: Users, color: "from-blue-500 to-blue-600", subtitle: `${kpis.totalPresent} present · ${kpis.totalAbsent} absent`, trend: kpis.attendancePct >= 85 ? "up" : "down" as any },
    { label: "Total Present", value: kpis.totalPresent, icon: CheckCircle2, color: "from-emerald-500 to-emerald-600", subtitle: `${kpis.batchCount} batches`, trend: "neutral" as any },
    { label: "Session Completion", value: kpis.sessionRate, unit: "%", icon: BookOpen, color: "from-violet-500 to-violet-600", subtitle: `${kpis.sessionsCompleted}/${kpis.sessionsPlanned} sessions`, trend: kpis.sessionRate >= 90 ? "up" : "neutral" as any },
    { label: "Cleaning Done", value: kpis.cleaningPct, unit: "%", icon: Sparkles, color: "from-cyan-500 to-cyan-600", subtitle: `${kpis.cleaningDone}/${kpis.cleaningTotal} slots`, trend: kpis.cleaningPct === 100 ? "up" : "neutral" as any },
    { label: "Placement Opportunities", value: kpis.placementCount, icon: Briefcase, color: "from-orange-500 to-orange-600", subtitle: `${kpis.totalApplied} applications`, trend: "up" as any },
    { label: "Total Applications", value: kpis.totalApplied, icon: Target, color: "from-pink-500 to-pink-600", subtitle: `${kpis.placementCount} active companies`, trend: "up" as any },
    { label: "CRT Participation", value: kpis.crtParticipationRate, unit: "%", icon: TrendingUp, color: "from-amber-500 to-amber-600", subtitle: `${kpis.totalCRTAttended} attended`, trend: kpis.crtParticipationRate >= 80 ? "up" : "neutral" as any },
    { label: "Open Escalations", value: kpis.openEscalations, icon: AlertTriangle, color: kpis.openEscalations > 0 ? "from-red-500 to-red-600" : "from-green-500 to-green-600", subtitle: `${kpis.resolvedEscalations} resolved`, trend: kpis.openEscalations === 0 ? "up" : "down" as any },
    { label: "Student Engagement", value: kpis.engagementAvg > 0 ? kpis.engagementAvg : kpis.pulsePositive, icon: HeartPulse, color: "from-teal-500 to-teal-600", subtitle: kpis.pulsePositive + kpis.pulseNeutral + kpis.pulseNegative > 0 ? `${kpis.pulsePositive} positive · ${kpis.pulseNegative} negative` : "pulse data", trend: kpis.pulseNegative === 0 ? "up" : "neutral" as any },
    { label: "AI Adoption", value: kpis.aiUsagePct > 0 ? kpis.aiUsagePct : kpis.aiRecords, unit: kpis.aiUsagePct > 0 ? "%" : "", icon: Zap, color: "from-indigo-500 to-indigo-600", subtitle: kpis.aiUsagePct > 0 ? "adoption rate" : `${kpis.aiRecords} records`, trend: "neutral" as any },
  ];

  return (
    <section id="overview" className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <h2 className="font-display font-bold text-2xl tracking-tight">Overview</h2>
          <span className="text-sm text-muted-foreground font-medium px-2 py-0.5 bg-secondary/60 rounded-full">{dateLabel}</span>
        </div>
        <p className="text-sm text-muted-foreground ml-5">Executive center health summary</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {kpiCards.map((card, i) => <KPICard key={card.label} {...card} delay={i * 0.03} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {attendanceChartData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4 text-foreground/80">Attendance by Batch</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={attendanceChartData} margin={{ top: 4, right: 4, left: -24, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-35} textAnchor="end" />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={ChartTooltipStyle} formatter={(v: any) => [`${v}%`, "Attendance"]} />
                <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                  {attendanceChartData.map((d, idx) => <Cell key={idx} fill={d.pct < 80 ? "#ef4444" : d.pct < 90 ? "#f59e0b" : "#10b981"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {sessionChartData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }} className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4 text-foreground/80">Session Delivery</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sessionChartData} margin={{ top: 4, right: 4, left: -24, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-35} textAnchor="end" />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={ChartTooltipStyle} />
                <Bar dataKey="planned" name="Planned" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {escalationDonut.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4 text-foreground/80">Escalation Status</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={escalationDonut} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {escalationDonut.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={ChartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {escalationDonut.map((e) => (
                  <div key={e.name} className="flex items-center gap-2 text-sm">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: e.color }} />
                    <span className="text-muted-foreground">{e.name}</span>
                    <span className="font-semibold ml-auto pl-4">{e.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {toArr(nd.placements).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45 }} className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4 text-foreground/80">Placement Pipeline</h3>
            <div className="space-y-3">
              {[
                { label: "Opportunities", value: toArr(nd.placements).length, color: "#3b82f6" },
                { label: "Shared to Students", value: toArr(nd.placements).reduce((s: number, r: any) => s + (Number(r?.["Shared To Students"]) || 0), 0), color: "#8b5cf6" },
                { label: "Applications", value: kpis.totalApplied, color: "#10b981" },
                { label: "CRT Shortlisted", value: kpis.totalShortlisted, color: "#f59e0b" },
                { label: "CRT Attended", value: kpis.totalCRTAttended, color: "#f97316" },
              ].map(({ label, value, color }, idx, arr) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-28 shrink-0 text-muted-foreground">{label}</span>
                  <div className="flex-1 h-4 bg-secondary/60 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${arr[0].value > 0 ? Math.min(100, (value / arr[0].value) * 100) : 0}%`, background: color }} />
                  </div>
                  <span className="text-sm font-bold w-8 text-right shrink-0">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {(kpis.pulsePositive + kpis.pulseNeutral + kpis.pulseNegative > 0 || kpis.totalCRTApplied > 0) && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {kpis.pulsePositive + kpis.pulseNeutral + kpis.pulseNegative > 0 && (
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold mb-4 text-foreground/80">Student Pulse</h3>
              <div className="space-y-3">
                {[
                  { label: "Positive", value: kpis.pulsePositive, color: "bg-green-500", tc: "text-green-600 dark:text-green-400" },
                  { label: "Neutral", value: kpis.pulseNeutral, color: "bg-amber-500", tc: "text-amber-600 dark:text-amber-400" },
                  { label: "Negative", value: kpis.pulseNegative, color: "bg-red-500", tc: "text-red-600 dark:text-red-400" },
                ].map(({ label, value, color, tc }) => {
                  const total = kpis.pulsePositive + kpis.pulseNeutral + kpis.pulseNegative;
                  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-16 shrink-0">{label}</span>
                      <div className="flex-1 h-4 bg-secondary/60 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`text-xs font-bold ${tc} w-16 text-right shrink-0`}>{value} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {kpis.totalCRTApplied > 0 && (
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold mb-4 text-foreground/80">CRT Pipeline</h3>
              <div className="space-y-3">
                {[
                  { label: "Applied", value: kpis.totalCRTApplied, color: "#3b82f6" },
                  { label: "Shortlisted", value: kpis.totalShortlisted, color: "#8b5cf6" },
                  { label: "Attended", value: kpis.totalCRTAttended, color: "#10b981" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-20 shrink-0">{label}</span>
                    <div className="flex-1 h-5 bg-secondary/60 rounded-full overflow-hidden">
                      <div className="h-full rounded-full flex items-center justify-end pr-2" style={{ width: `${kpis.totalCRTApplied > 0 ? Math.min(100, (value / kpis.totalCRTApplied) * 100) : 0}%`, background: color }}>
                        {kpis.totalCRTApplied > 0 && (value / kpis.totalCRTApplied) * 100 > 15 && (
                          <span className="text-[10px] text-white font-bold">{Math.round((value / kpis.totalCRTApplied) * 100)}%</span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold w-8 text-right shrink-0">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.55 }}
        className="bg-gradient-to-r from-primary/8 via-primary/4 to-transparent border border-primary/20 rounded-2xl p-5 flex gap-4 items-start"
      >
        <div className="h-9 w-9 shrink-0 bg-primary/15 rounded-xl flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1.5">Executive Summary — {dateLabel}</p>
          <p className="text-sm leading-relaxed text-foreground/80">{summary}</p>
        </div>
      </motion.div>
    </section>
  );
}
