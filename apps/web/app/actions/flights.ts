"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AIRLINES } from "@/lib/flights/airlines";
import type {
  ActionResult,
  AirlineKey,
  UpcomingFlight,
} from "@wayloft/shared";

export async function addFlight(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: {
        category: "permission",
        message: "Sign in to continue.",
        isRetryable: false,
      },
    };
  }

  const airline = formData.get("airline") as AirlineKey | null;
  const confirmationNumber = (
    formData.get("confirmation_number") as string
  )?.trim();
  const origin = (formData.get("origin") as string)?.trim().toUpperCase();
  const destination = (
    formData.get("destination") as string
  )?.trim().toUpperCase();
  const departureDateRaw = formData.get("departure_at") as string;
  // Date input gives YYYY-MM-DD — default to noon local for check-in countdown
  const departureAt = departureDateRaw
    ? `${departureDateRaw}T12:00:00`
    : "";
  const passengerName = (formData.get("passenger_name") as string)?.trim();
  const bookingType = (formData.get("booking_type") as string) || "miles";
  const milesPaid = formData.get("miles_paid")
    ? Number(formData.get("miles_paid"))
    : null;
  const cashPaidCents = formData.get("cash_paid")
    ? Math.round(parseFloat(formData.get("cash_paid") as string) * 100)
    : null;
  const cabinClass = (formData.get("cabin_class") as string) || "economy";
  const seatPreference =
    (formData.get("seat_preference") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!airline || !AIRLINES[airline]) {
    return {
      success: false,
      error: {
        category: "validation",
        message: "Select an airline.",
        field: "airline",
        isRetryable: false,
      },
    };
  }

  if (!confirmationNumber) {
    return {
      success: false,
      error: {
        category: "validation",
        message: "Confirmation number is required.",
        field: "confirmation_number",
        isRetryable: false,
      },
    };
  }

  if (!origin || origin.length !== 3) {
    return {
      success: false,
      error: {
        category: "validation",
        message: "Enter a valid 3-letter airport code for origin.",
        field: "origin",
        isRetryable: false,
      },
    };
  }

  if (!destination || destination.length !== 3) {
    return {
      success: false,
      error: {
        category: "validation",
        message: "Enter a valid 3-letter airport code for destination.",
        field: "destination",
        isRetryable: false,
      },
    };
  }

  if (!departureAt) {
    return {
      success: false,
      error: {
        category: "validation",
        message: "Departure date is required.",
        field: "departure_at",
        isRetryable: false,
      },
    };
  }

  if (!passengerName) {
    return {
      success: false,
      error: {
        category: "validation",
        message: "Passenger name is required.",
        field: "passenger_name",
        isRetryable: false,
      },
    };
  }

  // Compute check-in window
  const airlineInfo = AIRLINES[airline];
  const departureDate = new Date(departureAt);
  const checkinOpensAt = new Date(
    departureDate.getTime() - airlineInfo.checkinWindowHours * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("user_flights")
    .insert({
      user_id: user.id,
      airline,
      confirmation_number: confirmationNumber,
      origin,
      destination,
      departure_at: departureAt,
      passenger_name: passengerName,
      booking_type: bookingType,
      miles_paid: milesPaid,
      cash_paid_cents: cashPaidCents,
      points_program: airlineInfo.pointsProgram,
      cabin_class: cabinClass,
      seat_preference: seatPreference,
      checkin_opens_at: checkinOpensAt,
      notes,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: {
          category: "validation",
          message:
            "A flight with this airline and confirmation number already exists.",
          description: error.message,
          isRetryable: false,
        },
      };
    }
    return {
      success: false,
      error: {
        category: "transient",
        message: "Could not add flight. Please try again.",
        description: error.message,
        isRetryable: true,
      },
    };
  }

  revalidatePath("/travel");
  return { success: true, data: { id: data.id } };
}

export async function getUpcomingFlights(): Promise<
  ActionResult<UpcomingFlight[]>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: {
        category: "permission",
        message: "Sign in to continue.",
        isRetryable: false,
      },
    };
  }

  const { data, error } = await supabase
    .from("upcoming_flights")
    .select(
      "id, user_id, airline, confirmation_number, origin, destination, departure_at, arrival_at, return_departure_at, return_arrival_at, passenger_name, booking_type, miles_paid, cash_paid_cents, points_program, cabin_class, seat_preference, preferred_seat_number, checkin_opens_at, checkin_completed_at, boarding_position, current_award_price, lowest_seen_price, price_last_checked_at, notes, created_at, updated_at, checkin_opens_at_computed, hours_until_checkin, hours_until_departure, flight_status"
    )
    .eq("user_id", user.id)
    .order("departure_at", { ascending: true });

  if (error) {
    return {
      success: false,
      error: {
        category: "transient",
        message: "Could not load flights. Please try again.",
        description: error.message,
        isRetryable: true,
      },
    };
  }

  return { success: true, data: (data ?? []) as UpcomingFlight[] };
}

export async function updateFlight(
  flightId: string,
  updates: Partial<{
    checkin_completed_at: string;
    boarding_position: string;
    notes: string;
    seat_preference: string;
    preferred_seat_number: string;
  }>
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: {
        category: "permission",
        message: "Sign in to continue.",
        isRetryable: false,
      },
    };
  }

  const { error } = await supabase
    .from("user_flights")
    .update(updates)
    .eq("id", flightId)
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (error) {
    return {
      success: false,
      error: {
        category: "transient",
        message: "Could not update flight. Please try again.",
        description: error.message,
        isRetryable: true,
      },
    };
  }

  revalidatePath("/travel");
  return { success: true };
}

export async function removeFlight(flightId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: {
        category: "permission",
        message: "Sign in to continue.",
        isRetryable: false,
      },
    };
  }

  // Soft delete
  const { error } = await supabase
    .from("user_flights")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", flightId)
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (error) {
    return {
      success: false,
      error: {
        category: "transient",
        message: "Could not remove flight. Please try again.",
        description: error.message,
        isRetryable: true,
      },
    };
  }

  revalidatePath("/travel");
  return { success: true };
}
