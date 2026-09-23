"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BookOpen, CheckCircle2, Clock, Tags } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useStats } from "@/hooks/use-stats";

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StatisticsPage() {
  const { data: stats, isLoading } = useStats();

  return (
    <div>
      <PageHeader title="Statistics" description="Your study activity at a glance." />

      {isLoading && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile icon={BookOpen} label="Total lessons" value={String(stats.totalLessons)} />
            <StatTile icon={Clock} label="Hours recorded" value={stats.hoursRecorded.toFixed(1)} />
            <StatTile icon={Tags} label="Subjects" value={String(stats.totalSubjects)} />
            <StatTile icon={CheckCircle2} label="Task completion" value={`${stats.completionRate}%`} />
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Lessons by subject</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.lessonsBySubject.length === 0 ? (
                <EmptyState icon={Tags} title="No lessons recorded yet" />
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.lessonsBySubject} margin={{ left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ className: "stroke-border" }}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        cursor={{ fill: "var(--muted)" }}
                        contentStyle={{
                          background: "var(--popover)",
                          color: "var(--popover-foreground)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-md)",
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="count" name="Lessons" radius={[6, 6, 0, 0]}>
                        {stats.lessonsBySubject.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
