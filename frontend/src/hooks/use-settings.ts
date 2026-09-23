"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { usersApi } from "@/lib/api";
import { AUTH_QUERY_KEY } from "./use-auth";

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: ({ user }) => queryClient.setQueryData(AUTH_QUERY_KEY, user),
  });
}

export function useSetApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.setApiKey,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY }),
  });
}

export function useClearApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.clearApiKey,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY }),
  });
}

export function useResetData() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: usersApi.resetData,
    onSuccess: () => {
      queryClient.invalidateQueries();
      router.push("/record");
    },
  });
}
