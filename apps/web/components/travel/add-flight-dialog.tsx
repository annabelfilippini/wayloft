"use client";

import { useState } from "react";
import { Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AIRLINES, AIRLINE_KEYS } from "@/lib/flights/airlines";
import { addFlight } from "@/app/actions/flights";
import type { AirlineKey } from "@wayloft/shared";

export function AddFlightDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [airline, setAirline] = useState<AirlineKey | "">("");
  const [bookingType, setBookingType] = useState("miles");
  const [cabinClass, setCabinClass] = useState("economy");
  const [seatPreference, setSeatPreference] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    formData.set("airline", airline);
    formData.set("booking_type", bookingType);
    formData.set("cabin_class", cabinClass);
    formData.set("seat_preference", seatPreference);

    const result = await addFlight(formData);

    if (!result.success) {
      setError(result.error.message);
      setIsSubmitting(false);
      return;
    }

    setAirline("");
    setBookingType("miles");
    setCabinClass("economy");
    setSeatPreference("");
    setIsSubmitting(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Add Flight
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a Flight</DialogTitle>
          <DialogDescription>
            Track a booked flight for check-in alerts and price monitoring.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Airline */}
          <div className="space-y-1.5">
            <Label>Airline</Label>
            <Select
              value={airline}
              onValueChange={(v) => setAirline(v as AirlineKey)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select airline" />
              </SelectTrigger>
              <SelectContent>
                {AIRLINE_KEYS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {AIRLINES[key].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Confirmation number + passenger name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="confirmation_number">Confirmation #</Label>
              <Input
                id="confirmation_number"
                name="confirmation_number"
                placeholder="ABC123"
                className="mono uppercase"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="passenger_name">Passenger Name</Label>
              <Input
                id="passenger_name"
                name="passenger_name"
                placeholder="As on ticket"
                required
              />
            </div>
          </div>

          {/* Route + date */}
          <div className="grid grid-cols-[1fr_1fr_2fr] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="origin">From</Label>
              <Input
                id="origin"
                name="origin"
                placeholder="DTW"
                maxLength={3}
                className="mono uppercase"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="destination">To</Label>
              <Input
                id="destination"
                name="destination"
                placeholder="MCO"
                maxLength={3}
                className="mono uppercase"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="departure_at">Departure</Label>
              <Input
                id="departure_at"
                name="departure_at"
                type="date"
                className="mono"
                required
              />
            </div>
          </div>

          {/* Booking type + amount */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Paid With</Label>
              <Select value={bookingType} onValueChange={setBookingType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="miles">Miles / Points</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">
                {bookingType === "miles" ? "Miles Paid" : "Amount ($)"}
              </Label>
              {bookingType === "miles" ? (
                <Input
                  id="amount"
                  name="miles_paid"
                  type="number"
                  placeholder="12400"
                  className="mono"
                  required
                />
              ) : (
                <Input
                  id="amount"
                  name="cash_paid_cents"
                  type="number"
                  placeholder="15900"
                  className="mono"
                  required
                />
              )}
            </div>
          </div>

          {/* Cabin + seat */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cabin</Label>
              <Select value={cabinClass} onValueChange={setCabinClass}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="premium_economy">Premium Economy</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="first">First</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Seat Preference</Label>
              <Select value={seatPreference} onValueChange={setSeatPreference} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="window">Window</SelectItem>
                  <SelectItem value="aisle">Aisle</SelectItem>
                  <SelectItem value="exit_row">Exit Row</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes (optional, collapsed) */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">
              Notes{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input id="notes" name="notes" placeholder="Family trip, etc." />
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Flight"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
