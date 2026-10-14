"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { lessonsApi, type CreateLessonInput } from "@/lib/api";

export function useCreateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLessonInput) => lessonsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
}
