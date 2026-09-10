import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QuickTripFormSchema, type QuickTripFormData, type QuickTripWithOrganizer } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const categories = [
  ["roadtrip", "Road Trip"], ["hiking", "Hiking"], ["beach", "Beach"],
  ["culture", "Cultural"], ["wellness", "Wellness"], ["festival", "Festival"],
  ["workshop", "Workshop"], ["wildlife", "Wildlife"], ["food", "Food & Culinary"],
  ["adventure_sport", "Adventure Sports"],
] as const;

function valuesFor(trip: QuickTripWithOrganizer): QuickTripFormData {
  return {
    fromLocation: trip.fromLocation,
    toLocation: trip.toLocation,
    region: trip.region,
    date: new Date(trip.date).toISOString().split("T")[0],
    time: trip.time,
    title: trip.title,
    description: trip.description,
    category: trip.category === "unknown" ? "adventure_sport" : trip.category,
    seatsAvailable: trip.seatsAvailable,
    isFree: trip.isFree,
    seatPrice: trip.seatPrice,
  };
}

export function QuickTripEditDialog({
  open,
  onOpenChange,
  trip,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: QuickTripWithOrganizer;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<QuickTripFormData>({
    resolver: zodResolver(QuickTripFormSchema),
    defaultValues: valuesFor(trip),
  });
  const isFree = form.watch("isFree");

  useEffect(() => {
    if (open) form.reset(valuesFor(trip));
  }, [open, trip, form]);

  const mutation = useMutation({
    mutationFn: async (data: QuickTripFormData) => {
      const response = await apiRequest("PATCH", `/api/quick-trips/${trip.id}`, data);
      return response.json();
    },
    onSuccess: (updatedTrip) => {
      queryClient.setQueryData(["/api/quick-trips", trip.id], updatedTrip);
      queryClient.invalidateQueries({ queryKey: ["/api/quick-trips", trip.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/quick-trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      toast({ title: "Quick Trip updated", description: "Your changes are now live." });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Could not update trip", description: error.message || "Please try again.", variant: "destructive" });
    },
  });

  const today = new Date().toISOString().split("T")[0];
  const maxDateValue = new Date();
  maxDateValue.setDate(maxDateValue.getDate() + 5);
  const maxDate = maxDateValue.toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Quick Trip</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Trip title</FormLabel><FormControl><Input maxLength={100} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={4} maxLength={500} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="fromLocation" render={({ field }) => (
                <FormItem><FormLabel>Departure location</FormLabel><FormControl><Input maxLength={100} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="toLocation" render={({ field }) => (
                <FormItem><FormLabel>Destination</FormLabel><FormControl><Input maxLength={100} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="region" render={({ field }) => (
              <FormItem><FormLabel>Region</FormLabel><FormControl><Input maxLength={50} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" min={today} max={maxDate} {...field} value={typeof field.value === "string" ? field.value : ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="time" render={({ field }) => (
                <FormItem><FormLabel>Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Category</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{categories.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="seatsAvailable" render={({ field }) => (
                <FormItem><FormLabel>Seats available</FormLabel><FormControl><Input type="number" min={1} max={50} {...field} onChange={(event) => field.onChange(Number(event.target.value))} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="isFree" render={({ field }) => (
              <FormItem><FormLabel>Pricing</FormLabel><Select value={field.value ? "free" : "paid"} onValueChange={(value) => { field.onChange(value === "free"); if (value === "free") form.setValue("seatPrice", null); }}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="free">Free</SelectItem><SelectItem value="paid">Paid</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )} />
            {!isFree && <FormField control={form.control} name="seatPrice" render={({ field }) => (
              <FormItem><FormLabel>Price per seat (LKR)</FormLabel><FormControl><Input type="number" min={1} max={100000} value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value === "" ? null : Number(event.target.value))} /></FormControl><FormMessage /></FormItem>
            )} />}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save changes"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}