"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";

export const AUTH_QUERY_KEY = ["auth", "me"] as const;

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ user }) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, user);
      router.push("/");
    },
  });
}
