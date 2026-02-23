"use client";

import { useState } from "react";
import { useActionState } from "react";
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
import { updateProfile } from "@/app/actions/profile";

interface ProfileFormProps {
  profile: {
    full_name: string | null;
    home_airport: string | null;
    preferred_cabin: string;
    preferred_airlines: string[] | null;
  };
  email: string;
}

type ActionState = { error?: string; success?: boolean };

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const [cabin, setCabin] = useState(profile.preferred_cabin);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      return updateProfile(formData);
    },
    {}
  );

  return (
    <div className="mt-6 rounded-lg border p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Profile
      </h2>
      <form action={formAction} className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} disabled className="bg-muted" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            name="full_name"
            defaultValue={profile.full_name ?? ""}
            placeholder="Your name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="home_airport">Home Airport (IATA code)</Label>
          <Input
            id="home_airport"
            name="home_airport"
            defaultValue={profile.home_airport ?? ""}
            placeholder="e.g. DTW"
            maxLength={4}
            className="w-32 uppercase"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferred_cabin">Preferred Cabin</Label>
          <input type="hidden" name="preferred_cabin" value={cabin} />
          <Select value={cabin} onValueChange={setCabin}>
            <SelectTrigger id="preferred_cabin" className="w-48">
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

        <div className="space-y-2">
          <Label htmlFor="preferred_airlines">
            Preferred Airlines (comma-separated codes)
          </Label>
          <Input
            id="preferred_airlines"
            name="preferred_airlines"
            defaultValue={profile.preferred_airlines?.join(", ") ?? ""}
            placeholder="e.g. UA, DL, AA"
          />
        </div>

        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {state.success && (
          <p className="text-sm text-green-600">Profile updated</p>
        )}

        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </div>
  );
}
