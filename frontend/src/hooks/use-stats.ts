"use client";

import { useQuery } from "@tanstack/react-query";
import { statsApi, teamApi } from "@/lib/api";

export const STATS_KEY = ["stats"] as const;
export const TEAM_KEY = ["team"] as const;

export function useStats() {
  return useQuery({
    queryKey: STATS_KEY,
    queryFn: statsApi.get,
  });
}

export function useTeam() {
  return useQuery({
    queryKey: TEAM_KEY,
    queryFn: async () => (await teamApi.list()).team,
  });
}
