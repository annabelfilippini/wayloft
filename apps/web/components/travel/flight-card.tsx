"use client";

import { useState } from "react";
import { Plane, Clock, Trash2, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AIRLINES } from "@/lib/flights/airlines";
import { removeFlight } from "@/app/actions/flights";
import type { UpcomingFlight, FlightStatus } from "@wayloft/shared";

const STATUS_CONFIG: Record<
  FlightStatus,
  { label: string; className: string }
> = {
  upcoming: {
    label: "Upcoming",
    className: "bg-secondary text-secondary-foreground",
  },
  checkin_soon: {
    label: "Check-in Soon",
    className: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
  },
  checkin_open: {
    label: "Check In Now",
    className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200",
  },
  checked_in: {
    label: "Checked In",
    className: "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200",
  },
  departed: {
    label: "Departed",
    className: "bg-muted text-muted-foreground",
  },
};

function formatCheckinCountdown(hours: number): string {
  if (hours <= 0) return "Now";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  if (remainingHours === 0) return `${days}d`;
  return `${days}d ${remainingHours}h`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

interface FlightCardProps {
  flight: UpcomingFlight;
}

export function FlightCard({ flight }: FlightCardProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const airline = AIRLINES[flight.airline];
  const status = STATUS_CONFIG[flight.flight_status] ?? STATUS_CONFIG.upcoming;

  async function handleRemove() {
    setIsRemoving(true);
    await removeFlight(flight.id);
  }

  return (
    <div className="relative border bg-card">
      {/* Airline color bar */}
      <div
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: airline.color }}
      />

      <div className="flex items-start justify-between gap-4 py-3 pr-3 pl-4">
        {/* Left: route + details */}
        <div className="min-w-0 flex-1">
          {/* Airline + status */}
          <div className="flex items-center gap-2">
            <span className="label-signal" style={{ color: airline.color }}>
              {airline.name}
            </span>
            <Badge variant="secondary" className={status.className}>
              {status.label}
            </Badge>
          </div>

          {/* Route */}
          <div className="mt-1.5 flex items-center gap-2">
            <span className="mono text-lg font-semibold">{flight.origin}</span>
            <Plane className="h-4 w-4 text-muted-foreground" />
            <span className="mono text-lg font-semibold">
              {flight.destination}
            </span>
          </div>

          {/* Date */}
          <p className="mt-0.5 text-sm text-muted-foreground">
            {formatDate(flight.departure_at)}
          </p>

          {/* Confirmation + passenger + miles */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              Conf:{" "}
              <span className="mono font-medium text-foreground">
                {flight.confirmation_number}
              </span>
            </span>
            <span>{flight.passenger_name}</span>
            {flight.booking_type === "miles" && flight.miles_paid && (
              <span>
                <span className="mono font-medium text-foreground">
                  {flight.miles_paid.toLocaleString()}
                </span>{" "}
                {airline.pointsCurrency}
              </span>
            )}
            {flight.booking_type === "cash" && flight.cash_paid_cents && (
              <span className="mono font-medium text-foreground">
                ${(flight.cash_paid_cents / 100).toFixed(2)}
              </span>
            )}
            {flight.cabin_class !== "economy" && (
              <Badge variant="outline" className="text-[10px]">
                {flight.cabin_class.replace("_", " ")}
              </Badge>
            )}
          </div>
        </div>

        {/* Right: countdown + actions */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          {/* Check-in countdown */}
          {flight.flight_status !== "departed" &&
            flight.flight_status !== "checked_in" && (
              <div className="text-right">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Check-in</span>
                </div>
                <span className="mono text-sm font-semibold">
                  {flight.hours_until_checkin <= 0
                    ? "Open"
                    : formatCheckinCountdown(flight.hours_until_checkin)}
                </span>
              </div>
            )}

          {flight.flight_status === "checked_in" &&
            flight.boarding_position && (
              <div className="text-right">
                <div className="text-xs text-muted-foreground">
                  Boarding
                </div>
                <span className="mono text-sm font-semibold">
                  {flight.boarding_position}
                </span>
              </div>
            )}

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={isRemoving}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleRemove}
                disabled={isRemoving}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove flight
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
