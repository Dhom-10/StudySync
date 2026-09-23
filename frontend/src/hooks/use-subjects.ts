"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subjectsApi } from "@/lib/api";

export const SUBJECTS_KEY = ["subjects"] as const;

export function useSubjects() {
  return useQuery({
    queryKey: SUBJECTS_KEY,
    queryFn: async () => (await subjectsApi.list()).subjects,
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: subjectsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SUBJECTS_KEY }),
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof subjectsApi.update>[1] }) =>
      subjectsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SUBJECTS_KEY }),
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: subjectsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBJECTS_KEY });
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
    },
  });
}
