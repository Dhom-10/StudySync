"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { lessonsApi } from "@/lib/api";

export function useCreateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: lessonsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
}

const LIST_KEY = ["lessons", "list"] as const;

// Sidebar list of past sessions; keeps refreshing while any session is still being worked on.
export function useLessons() {
  return useQuery({
    queryKey: LIST_KEY,
    queryFn: lessonsApi.list,
    refetchInterval: (query) =>
      query.state.data?.some((l) => l.status === "recording" || l.status === "processing") ? 3000 : false,
  });
}

export function useDeleteLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: lessonsApi.remove,
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: ["lessons", id] });
      return queryClient.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}

export function useAddChunk() {
  return useMutation({
    mutationFn: (v: { id: number; audio: Blob; seq: number; start: number }) =>
      lessonsApi.addChunk(v.id, v.audio, v.seq, v.start),
  });
}

export function useFinishLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: lessonsApi.finish,
    // Returning the promise keeps the mutation pending until the fresh status has loaded.
    onSuccess: (_data, id) => queryClient.invalidateQueries({ queryKey: ["lessons", id] }),
  });
}

// Polls while the lesson is being recorded (new transcript lines) or processed (summary).
export function useLesson(id: number | null) {
  return useQuery({
    queryKey: ["lessons", id],
    queryFn: () => lessonsApi.get(id as number),
    enabled: id !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "recording" || status === "processing" ? 1000 : false;
    },
  });
}
