"use client";

import { Plane } from "lucide-react";
import { FlightCard } from "./flight-card";
import { AddFlightDialog } from "./add-flight-dialog";
import type { UpcomingFlight } from "@wayloft/shared";

interface FlightDashboardProps {
  flights: UpcomingFlight[];
}

export function FlightDashboard({ flights }: FlightDashboardProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="label-signal text-muted-foreground">TRIPS</span>
        <AddFlightDialog />
      </div>

      {flights.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center border border-dashed py-10 text-center">
          <Plane className="h-8 w-8 text-muted-foreground/50" />
          <h3 className="mt-3 text-sm font-semibold">No flights tracked</h3>
          <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
            Add a booked flight when you want Wayloft to remind you about
            check-in.
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {flights.map((flight) => (
            <FlightCard key={flight.id} flight={flight} />
          ))}
        </div>
      )}
    </div>
  );
}
