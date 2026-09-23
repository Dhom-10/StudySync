"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignmentsApi } from "@/lib/api";
import { STATS_KEY } from "./use-stats";

export const ASSIGNMENTS_KEY = ["assignments"] as const;

export function useAssignments() {
  return useQuery({
    queryKey: ASSIGNMENTS_KEY,
    queryFn: async () => (await assignmentsApi.list()).assignments,
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignmentsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_KEY }),
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof assignmentsApi.update>[1] }) =>
      assignmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_KEY });
      queryClient.invalidateQueries({ queryKey: STATS_KEY });
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignmentsApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_KEY }),
  });
}
