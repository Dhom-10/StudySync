"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { lessonsApi } from "@/lib/api";
import { SUBJECTS_KEY } from "./use-subjects";
import { ASSIGNMENTS_KEY } from "./use-assignments";
import { STATS_KEY } from "./use-stats";

export const lessonsKey = (subjectId?: string) => ["lessons", subjectId ?? "all"] as const;

export function useLessons(subjectId?: string) {
  return useQuery({
    queryKey: lessonsKey(subjectId),
    queryFn: async () => (await lessonsApi.list(subjectId)).lessons,
  });
}

function invalidateLessonRelated(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["lessons"] });
  queryClient.invalidateQueries({ queryKey: SUBJECTS_KEY });
  queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_KEY });
  queryClient.invalidateQueries({ queryKey: STATS_KEY });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: lessonsApi.create,
    onSuccess: () => invalidateLessonRelated(queryClient),
  });
}

export function useDeleteLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: lessonsApi.remove,
    onSuccess: () => invalidateLessonRelated(queryClient),
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, taskId, done }: { lessonId: string; taskId: string; done: boolean }) =>
      lessonsApi.toggleTask(lessonId, taskId, done),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      queryClient.invalidateQueries({ queryKey: STATS_KEY });
    },
  });
}
