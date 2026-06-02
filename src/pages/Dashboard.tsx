import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useGetDashboardData, getGetDashboardDataQueryKey } from "@/lib/api-client";
import {
  Menu, X, RefreshCw, Sun, Moon, Download, Search,
  TrendingUp, Users, Sparkles, Building2, BookOpen,
  ClipboardCheck, Briefcase, Target, AlertTriangle,
  Rocket, Brain, BookMarked, HeartPulse, Star,
  LayoutGrid, ChevronLeft, ChevronRight, Wifi, WifiOff,
  Clock, Calendar as CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import type { DateRange } from "react-day-picker";
import { OverviewSection } from "@/components/OverviewSection";
import { SectionRenderer } from "@/components/SectionRenderer";

const SECTION_ICONS: Record<string, React.ElementType> = {
  attendance: Users,
  cleaning: Sparkles,
  infrastructure: Building2,
  session_delivery: BookOpen,
  assessments: ClipboardCheck,
  placements: Briefcase,
  crt: Target,
  escalations: AlertTriangle,
  product_initiatives: Rocket,
  ai_adoption: Brain,
  playbooks: BookMarked,
  student_pulse: HeartPulse,
  faculty_feedback: Star,
  transport: TrendingUp,
  food: LayoutGrid,
  mentor_tracking: Users,
};

const formatLabel = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

type DateFilterType = "today" | "yesterday" | "last7days" | "thisweek" | "thismonth" | "custom" | "range";

interface DateFilterState {
  type: DateFilterType;
  customDate?: Date;
  range?: DateRange;
}

function getApiDateParam(filter: DateFilterState): string {
  switch (filter.type) {
    case "today": return "today";
    case "yesterday": return "yesterday";
    case "last7days": return "last7days";
    case "thisweek": return "this_week";
    case "thismonth": return "this_month";
    case "custom":
      return filter.customDate ? format(filter.customDate, "dd-MM-yyyy") : "today";
    case "range":
      if (filter.range?.from && filter.range?.to) {
        return `${format(filter.range.from, "dd-MM-yyyy")}:${format(filter.range.to, "dd-MM-yyyy")}`;
      }
      return "today";
    default: return "today";
  }
}

function getFilterLabel(filter: DateFilterState): string {
  switch (filter.type) {
    case "today": return "Today";
    case "yesterday": return "Yesterday";
    case "last7days": return "Last 7 Days";
    case "thisweek": return "This Week";
    case "thismonth": return "This Month";
    case "custom":
      return filter.customDate ? format(filter.customDate, "dd MMM yyyy") : "Custom";
    case "range":
      if (filter.range?.from && filter.range?.to)
        return `${format(filter.range.from, "dd MMM")} – ${format(filter.range.to, "dd MMM")}`;
      return "Date Range";
    default: return "Today";
  }
}

function parseRowDate(val: any): Date | null {
  if (!val) return null;
  const parts = String(val).trim().split("-");
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return isNaN(date.getTime()) ? null : date;
}

function filterSectionByDate(rows: any[], filter: DateFilterState): any[] {
  if (!Array.isArray(rows) || rows.length === 0) return rows;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let start: Date | null = null;
  let end: Date | null = null;

  switch (filter.type) {
    case "today":
      start = new Date(today);
      end = new Date(today);
      break;
    case "yesterday": {
      const y = subDays(today, 1);
      start = y; end = new Date(y);
      break;
    }
    case "last7days":
      start = subDays(today, 6);
      end = new Date(today);
      break;
    case "thisweek":
      start = startOfWeek(today, { weekStartsOn: 1 });
      end = endOfWeek(today, { weekStartsOn: 1 });
      break;
    case "thismonth":
      start = startOfMonth(today);
      end = endOfMonth(today);
      break;
    case "custom":
      if (filter.customDate) {
        const d = new Date(filter.customDate);
        d.setHours(0, 0, 0, 0);
        start = d; end = new Date(d);
      }
      break;
    case "range":
      if (filter.range?.from) {
        start = new Date(filter.range.from);
        start.setHours(0, 0, 0, 0);
      }
      if (filter.range?.to) {
        end = new Date(filter.range.to);
      } else if (start) {
        end = new Date(start);
      }
      break;
  }

  if (!start) return rows;
  if (!end) end = new Date(start);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const s = start.getTime();
  const e = end.getTime();

  return rows.filter((row) => {
    const rowDate = parseRowDate(row?.Date);
    if (!rowDate) return true;
    const t = rowDate.getTime();
    return t >= s && t <= e;
  });
}

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ type: "today" });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [customDate, setCustomDate] = useState<Date | undefined>();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [tempDateType, setTempDateType] = useState<DateFilterType>("today");
  const [isDark, setIsDark] = useState(false);

  const apiDate = getApiDateParam(dateFilter);

  const queryKey = getGetDashboardDataQueryKey({ date: apiDate });
  const { data, isLoading, isError, refetch, isRefetching, dataUpdatedAt } = useGetDashboardData(
    { date: apiDate },
    { query: { queryKey, refetchInterval: 5 * 60 * 1000 } }
  );

  useEffect(() => {
    if (data && dataUpdatedAt) setLastSyncTime(new Date(dataUpdatedAt));
  }, [data, dataUpdatedAt]);

  const filteredData = useMemo(() => {
    if (!data) return null;
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      result[key] = Array.isArray(value) ? filterSectionByDate(value, dateFilter) : value;
    }
    return result as typeof data;
  }, [data, dateFilter]);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = saved === "dark" || (!saved && prefersDark);
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const dynamicSections = data
    ? Object.keys(data).map((key) => ({
        id: key,
        label: formatLabel(key),
        icon: SECTION_ICONS[key.toLowerCase()] ?? LayoutGrid,
      }))
    : [];

  const allNavItems = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    ...dynamicSections,
  ];

  const filteredNav = sidebarSearch
    ? allNavItems.filter((n) => n.label.toLowerCase().includes(sidebarSearch.toLowerCase()))
    : allNavItems;

  const navigateTo = (id: string) => {
    setSidebarOpen(false);
    setActiveSection(id);
  };

  const handleRefresh = useCallback(() => { refetch(); }, [refetch]);
  const handleExport = () => window.print();

  const applyDateFilter = () => {
    const newFilter: DateFilterState = { type: tempDateType };
    if (tempDateType === "custom") newFilter.customDate = customDate;
    if (tempDateType === "range") newFilter.range = dateRange;
    setDateFilter(newFilter);
    setDatePickerOpen(false);
  };

  const filterData = (sectionData: any) => {
    if (!searchQuery || !sectionData) return sectionData;
    if (Array.isArray(sectionData)) {
      return sectionData.filter((item) =>
        JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return sectionData;
  };

  const sidebarWidth = sidebarCollapsed ? "w-16" : "w-64";
  const mainOffset = sidebarCollapsed ? "md:ml-16" : "md:ml-64";

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 ${sidebarWidth} bg-card border-r border-border/50 z-40 flex flex-col transition-all duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className={`border-b border-border/30 flex items-center gap-3 ${sidebarCollapsed ? "p-3 justify-center" : "p-4"}`}>
          <img
            src="https://raw.githubusercontent.com/udaykiranpalepu-dotcom/photos/refs/heads/main/logo-removebg-preview.png"
            alt="NxtWave"
            className="h-9 w-9 shrink-0 rounded-lg object-contain bg-white/5"
          />
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="font-display font-bold text-sm leading-tight truncate">NxtWave Intensive</p>
              <p className="text-[10px] text-muted-foreground font-medium truncate">Training Center</p>
            </div>
          )}
        </div>

        {!sidebarCollapsed && (
          <div className="px-3 pt-3 pb-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter sections..."
                className="pl-8 h-8 text-xs bg-secondary/40 border-border/40"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
              />
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {!sidebarCollapsed && (
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2">Sections</p>
          )}
          {isLoading && !data
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className={`h-9 rounded-lg ${sidebarCollapsed ? "w-10 mx-auto" : "w-full"}`} />
              ))
            : filteredNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 group
                      ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"}
                      ${sidebarCollapsed ? "justify-center" : ""}`}
                  >
                    <Icon className={`shrink-0 h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                    {!sidebarCollapsed && <span className="flex-1 truncate text-left">{item.label}</span>}
                  </button>
                );
              })}
        </nav>

        <div className={`border-t border-border/30 p-3 flex items-center ${sidebarCollapsed ? "justify-center" : "justify-between"}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {isError ? (
                <><WifiOff className="h-3.5 w-3.5 text-red-500" /><span className="text-red-500">Disconnected</span></>
              ) : (
                <><Wifi className="h-3.5 w-3.5 text-green-500" /><span>Live</span></>
              )}
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hidden md:flex shrink-0"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <main className={`${mainOffset} flex flex-col min-h-screen transition-all duration-300`}>
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/40 shadow-sm">
          <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-border/20">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-4 w-4" />
              </Button>
              <img
                src="https://raw.githubusercontent.com/udaykiranpalepu-dotcom/photos/refs/heads/main/logo-removebg-preview.png"
                alt="NxtWave"
                className="h-9 w-auto object-contain hidden sm:block"
              />
              <div>
                <h1 className="font-display font-bold text-base sm:text-lg leading-tight tracking-tight">
                  NxtWave Training Center
                </h1>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Madhapur · Operations Intelligence Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="hidden md:flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>{format(new Date(), "EEEE, MMM d yyyy")}</span>
              </div>
              {lastSyncTime && (
                <div className="hidden sm:flex items-center gap-1.5 text-green-600 dark:text-green-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Synced {format(lastSyncTime, "HH:mm:ss")}</span>
                </div>
              )}
            </div>
          </div>

          <div className="px-4 sm:px-6 py-2 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[160px] max-w-[280px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search data..."
                className="pl-8 h-8 text-xs bg-card/50 border-border/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-8 text-xs gap-1.5 bg-card/50 border-border/50 font-medium">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {getFilterLabel(dateFilter)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 border-b border-border/50">
                  <Select value={tempDateType} onValueChange={(v) => setTempDateType(v as DateFilterType)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="last7days">Last 7 Days</SelectItem>
                      <SelectItem value="thisweek">This Week</SelectItem>
                      <SelectItem value="thismonth">This Month</SelectItem>
                      <SelectItem value="custom">Custom Date</SelectItem>
                      <SelectItem value="range">Date Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {tempDateType === "custom" && (
                  <Calendar mode="single" selected={customDate} onSelect={setCustomDate} initialFocus />
                )}
                {tempDateType === "range" && (
                  <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} initialFocus />
                )}
                <div className="p-3 border-t border-border/50 flex gap-2">
                  <Button size="sm" className="flex-1 h-8 text-xs" onClick={applyDateFilter}>Apply</Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setDatePickerOpen(false)}>Cancel</Button>
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex items-center gap-1.5 ml-auto">
              <Button variant="outline" size="icon" className="h-8 w-8 bg-card/50 border-border/50" onClick={handleRefresh} disabled={isLoading || isRefetching} title="Refresh data">
                <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 bg-card/50 border-border/50" onClick={toggleTheme} title="Toggle theme">
                {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 bg-card/50 border-border/50" onClick={handleExport} title="Download snapshot">
                <Download className="h-3.5 w-3.5" />
              </Button>
              {isRefetching && <span className="text-[11px] text-primary animate-pulse font-medium">Syncing...</span>}
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 print:p-4">
          <div className="max-w-[1440px] mx-auto">
            {isLoading && !data ? (
              <LoadingSkeleton />
            ) : isError ? (
              <ErrorState onRefresh={handleRefresh} />
            ) : filteredData ? (
              activeSection === "overview" ? (
                <OverviewSection data={filteredData} dateLabel={getFilterLabel(dateFilter)} />
              ) : dynamicSections.find((s) => s.id === activeSection) ? (
                <SectionRenderer
                  key={activeSection}
                  id={activeSection}
                  label={dynamicSections.find((s) => s.id === activeSection)!.label}
                  icon={dynamicSections.find((s) => s.id === activeSection)!.icon}
                  data={filterData((filteredData as any)[activeSection])}
                  delay={0}
                />
              ) : (
                <OverviewSection data={filteredData} dateLabel={getFilterLabel(dateFilter)} />
              )
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}

function ErrorState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 max-w-md mx-auto">
      <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center">
        <WifiOff className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-xl font-display font-bold">Connection Lost</h3>
      <p className="text-sm text-muted-foreground">Unable to reach Google Sheets. Check your connection and try again.</p>
      <Button onClick={onRefresh} className="mt-2">Retry</Button>
    </div>
  );
}
