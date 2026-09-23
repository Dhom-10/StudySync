"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Clock, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/use-auth";
import { useTeam } from "@/hooks/use-stats";
import { formatDuration } from "@/lib/dates";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function TeamPage() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const { data: team, isLoading } = useTeam();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== "admin") router.replace("/record");
  }, [user, router]);

  if (user && user.role !== "admin") return null;

  return (
    <div>
      <PageHeader title="Team" description="See every student's lessons and progress." />

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && team?.length === 0 && (
        <EmptyState icon={Users} title="No students yet" description="Once students sign up, they'll show up here." />
      )}

      {!isLoading && team && team.length > 0 && (
        <div className="space-y-3">
          {team.map((member) => {
            const expanded = expandedId === member.id;
            return (
              <Card key={member.id} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : member.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left"
                >
                  <Avatar className="size-9 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {initials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{member.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                  </div>
                  <div className="hidden shrink-0 items-center gap-4 text-xs text-muted-foreground sm:flex">
                    <span>{member.lessonCount} lessons</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" /> {member.hoursRecorded.toFixed(1)}h
                    </span>
                    <Badge variant="secondary">{member.completionRate}% done</Badge>
                  </div>
                  <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
                </button>

                {expanded && (
                  <CardContent className="border-t pt-4">
                    {member.lessons.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No lessons recorded yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {member.lessons.map((lesson) => (
                          <li key={lesson.id} className="flex items-center justify-between gap-3 text-sm">
                            <div className="flex min-w-0 items-center gap-2">
                              {lesson.subject && (
                                <span
                                  className="size-2 shrink-0 rounded-full"
                                  style={{ backgroundColor: lesson.subject.color }}
                                />
                              )}
                              <span className="truncate">{lesson.title}</span>
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {new Date(lesson.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              · {formatDuration(lesson.durationSec)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
