import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAccounts, setAccountRole } from "@/features/auth/auth.functions";
import { APP_ROLES, primaryRole, ROLE_LABELS, type AppRole } from "@/features/auth/types";
import { useAccount } from "@/features/auth/use-account";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({
    meta: [
      { title: "Team & roles — The Gentleman's Den" },
      {
        name: "description",
        content: "Owner tools for assigning owner, barber and client access at The Gentleman's Den.",
      },
      { property: "og:title", content: "Team & roles — The Gentleman's Den" },
      { property: "og:description", content: "Assign roles across the barbershop team." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const { data: account } = useAccount();
  const isOwner = account?.roles.includes("owner") ?? false;

  const fetchAccounts = useServerFn(listAccounts);
  const updateRole = useServerFn(setAccountRole);
  const queryClient = useQueryClient();

  const accountsQuery = useQuery({
    queryKey: ["managed-accounts"],
    queryFn: () => fetchAccounts(),
    enabled: isOwner,
    retry: false,
  });

  const roleMutation = useMutation({
    mutationFn: (input: { userId: string; role: AppRole }) => updateRole({ data: input }),
    onSuccess: () => {
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: ["managed-accounts"] });
    },
    onError: (error) =>
      toast.error("Could not update the role", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  if (!isOwner) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <ShieldAlert className="size-5 text-destructive" aria-hidden="true" />
          <CardTitle className="font-display text-xl">Owners only</CardTitle>
          <CardDescription>
            Managing team roles is restricted to the shop owner. Ask the owner if you need access.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Team &amp; roles</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every account on the platform. Change a role to grant owner, barber or client access —
          changes take effect the next time that person loads the app.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Accounts</CardTitle>
          <CardDescription>
            {accountsQuery.data ? `${accountsQuery.data.length} registered` : "Loading accounts"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accountsQuery.isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : accountsQuery.isError ? (
            <p className="text-sm text-destructive">
              We couldn't load the account list. Refresh to try again.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountsQuery.data?.map((managed) => {
                    const role = primaryRole(managed.roles);
                    const isSelf = managed.userId === account?.userId;
                    return (
                      <TableRow key={managed.userId}>
                        <TableCell className="font-medium">
                          {managed.fullName ?? "—"}
                          {isSelf ? (
                            <Badge variant="outline" className="ml-2">
                              You
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {managed.email ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {managed.phone ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={role}
                            disabled={isSelf || roleMutation.isPending}
                            onValueChange={(value) =>
                              roleMutation.mutate({
                                userId: managed.userId,
                                role: value as AppRole,
                              })
                            }
                          >
                            <SelectTrigger className="w-36" aria-label={`Role for ${managed.email ?? managed.userId}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {APP_ROLES.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {ROLE_LABELS[option]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
