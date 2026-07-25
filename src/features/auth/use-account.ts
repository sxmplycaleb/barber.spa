import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

import { getMyAccount, updateMyProfile } from "./auth.functions";
import { type Account, type AppRole } from "./types";

export const ACCOUNT_QUERY_KEY = ["account"] as const;
export const SESSION_QUERY_KEY = ["session"] as const;

/** Signed-in user id (or null), kept fresh by the root auth listener. */
export function useSessionUserId() {
  return useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.user.id ?? null;
    },
    staleTime: 30_000,
  });
}

/** The signed-in account (profile + roles). Only call inside protected UI. */
export function useAccount() {
  const fetchAccount = useServerFn(getMyAccount);
  return useQuery<Account>({
    queryKey: ACCOUNT_QUERY_KEY,
    queryFn: () => fetchAccount(),
    retry: false,
    staleTime: 60_000,
  });
}

export function useHasRole(role: AppRole): boolean {
  const { data } = useAccount();
  return data?.roles.includes(role) ?? false;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const update = useServerFn(updateMyProfile);
  return useMutation({
    mutationFn: (input: { fullName: string; phone: string }) => update({ data: input }),
    onSuccess: (account) => {
      queryClient.setQueryData(ACCOUNT_QUERY_KEY, account);
    },
  });
}

/** Ordered sign-out: cancel in-flight queries, drop cache, clear session. */
export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
    },
    onSuccess: () => {
      navigate({ to: "/auth", replace: true });
    },
  });
}
