import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, ShieldAlert, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAccount } from "@/features/auth/use-account";
import {
  createService,
  deleteService,
  listAllServices,
  updateService,
} from "@/features/services/services.functions";
import {
  formatDuration,
  formatKes,
  SERVICE_CATEGORIES,
  type Service,
} from "@/features/services/types";

export const Route = createFileRoute("/_authenticated/manage-services")({
  head: () => ({
    meta: [
      { title: "Manage services — The Gentleman's Den" },
      {
        name: "description",
        content: "Owner tools for the barbershop service catalog, pricing and durations.",
      },
      { property: "og:title", content: "Manage services — The Gentleman's Den" },
      { property: "og:description", content: "Create, price and retire bookable services." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ManageServicesPage,
});

interface FormState {
  name: string;
  description: string;
  category: string;
  priceKes: string;
  durationMinutes: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  category: SERVICE_CATEGORIES[0],
  priceKes: "1000",
  durationMinutes: "30",
  imageUrl: "",
  isActive: true,
  sortOrder: "0",
};

function toForm(service: Service): FormState {
  return {
    name: service.name,
    description: service.description ?? "",
    category: service.category,
    priceKes: String(service.priceKes),
    durationMinutes: String(service.durationMinutes),
    imageUrl: service.imageUrl ?? "",
    isActive: service.isActive,
    sortOrder: String(service.sortOrder),
  };
}

function ManageServicesPage() {
  const { data: account } = useAccount();
  const isOwner = account?.roles.includes("owner") ?? false;

  const fetchServices = useServerFn(listAllServices);
  const addService = useServerFn(createService);
  const editService = useServerFn(updateService);
  const removeService = useServerFn(deleteService);
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [pendingDelete, setPendingDelete] = useState<Service | null>(null);

  const servicesQuery = useQuery({
    queryKey: ["services", "all"],
    queryFn: () => fetchServices(),
    enabled: isOwner,
    retry: false,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["services"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        priceKes: Number(form.priceKes),
        durationMinutes: Number(form.durationMinutes),
        imageUrl: form.imageUrl,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder || "0"),
      };
      return editing
        ? editService({ data: { ...payload, id: editing.id } })
        : addService({ data: payload });
    },
    onSuccess: () => {
      toast.success(editing ? "Service updated" : "Service added");
      setDialogOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      invalidate();
    },
    onError: (error) =>
      toast.error("Could not save the service", {
        description: error instanceof Error ? error.message : undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeService({ data: { id } }),
    onSuccess: () => {
      toast.success("Service removed");
      setPendingDelete(null);
      invalidate();
    },
    onError: (error) =>
      toast.error("Could not remove the service", {
        description: error instanceof Error ? error.message : undefined,
      }),
  });

  const toggleMutation = useMutation({
    mutationFn: (service: Service) =>
      editService({
        data: {
          id: service.id,
          name: service.name,
          description: service.description ?? "",
          category: service.category,
          priceKes: service.priceKes,
          durationMinutes: service.durationMinutes,
          imageUrl: service.imageUrl ?? "",
          isActive: !service.isActive,
          sortOrder: service.sortOrder,
        },
      }),
    onSuccess: () => invalidate(),
    onError: (error) =>
      toast.error("Could not change visibility", {
        description: error instanceof Error ? error.message : undefined,
      }),
  });

  if (account && !isOwner) {
    return (
      <Card className="max-w-xl">
        <CardHeader>
          <ShieldAlert className="size-5 text-primary" aria-hidden="true" />
          <CardTitle className="font-display text-2xl">Owners only</CardTitle>
          <CardDescription>
            The service catalog can only be edited by the shop owner.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const services = servicesQuery.data ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="secondary" className="mb-3">
            Owner tools
          </Badge>
          <h1 className="font-display text-3xl sm:text-4xl">Services &amp; pricing</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Build the menu clients book from. Hidden services stay off the public page but keep
            their history.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setForm({ ...EMPTY_FORM, sortOrder: String(services.length + 1) });
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden="true" />
          New service
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">The catalog</CardTitle>
          <CardDescription>
            {services.length} service{services.length === 1 ? "" : "s"} configured.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {servicesQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : services.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No services yet — add your first one to open up booking.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Visible</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div className="font-medium">{service.name}</div>
                        {service.description ? (
                          <div className="max-w-sm truncate text-xs text-muted-foreground">
                            {service.description}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>{service.category}</TableCell>
                      <TableCell>{formatKes(service.priceKes)}</TableCell>
                      <TableCell>{formatDuration(service.durationMinutes)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={service.isActive}
                          onCheckedChange={() => toggleMutation.mutate(service)}
                          aria-label={`Toggle visibility for ${service.name}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit ${service.name}`}
                            onClick={() => {
                              setEditing(service);
                              setForm(toForm(service));
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${service.name}`}
                            onClick={() => setPendingDelete(service)}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {editing ? "Edit service" : "New service"}
            </DialogTitle>
            <DialogDescription>
              Pricing is in Kenyan shillings; duration decides how much of the chair it books.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              saveMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="service-name">Name</Label>
              <Input
                id="service-name"
                required
                minLength={2}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-description">Description</Label>
              <Textarea
                id="service-description"
                rows={3}
                maxLength={500}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="service-category">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm({ ...form, category: value })}
                >
                  <SelectTrigger id="service-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-order">Display order</Label>
                <Input
                  id="service-order"
                  type="number"
                  min={0}
                  max={999}
                  value={form.sortOrder}
                  onChange={(event) => setForm({ ...form, sortOrder: event.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-price">Price (KES)</Label>
                <Input
                  id="service-price"
                  type="number"
                  required
                  min={0}
                  step={50}
                  value={form.priceKes}
                  onChange={(event) => setForm({ ...form, priceKes: event.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-duration">Duration (minutes)</Label>
                <Input
                  id="service-duration"
                  type="number"
                  required
                  min={5}
                  max={600}
                  step={5}
                  value={form.durationMinutes}
                  onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-image">Photo URL (optional)</Label>
              <Input
                id="service-image"
                type="url"
                placeholder="https://"
                value={form.imageUrl}
                onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
              <div>
                <Label htmlFor="service-active">Visible to clients</Label>
                <p className="text-xs text-muted-foreground">
                  Hidden services stay off the public menu.
                </p>
              </div>
              <Switch
                id="service-active"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving…" : editing ? "Save changes" : "Add service"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the service from the catalog. If you only want to pause it, hide it
              instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
            >
              Remove service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
