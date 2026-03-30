"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateNotificationPreferences } from "@/app/actions/profile";

interface NotificationFormProps {
  notifications: {
    email_bonus_alerts: boolean;
    email_price_alerts: boolean;
    email_weekly_digest: boolean;
  };
}

type ActionState = { success?: boolean; error?: { message: string; isRetryable: boolean; category: string } | null };

export function NotificationForm({ notifications }: NotificationFormProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      return updateNotificationPreferences(formData);
    },
    {}
  );

  return (
    <div className="mt-4 rounded-lg border p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Notifications
      </h2>
      <form action={formAction} className="mt-4 space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="email_bonus_alerts" className="cursor-pointer">
            Transfer bonus alerts
          </Label>
          <Switch
            id="email_bonus_alerts"
            name="email_bonus_alerts"
            defaultChecked={notifications.email_bonus_alerts}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="email_price_alerts" className="cursor-pointer">
            Price drop alerts
          </Label>
          <Switch
            id="email_price_alerts"
            name="email_price_alerts"
            defaultChecked={notifications.email_price_alerts}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="email_weekly_digest" className="cursor-pointer">
            Weekly digest email
          </Label>
          <Switch
            id="email_weekly_digest"
            name="email_weekly_digest"
            defaultChecked={notifications.email_weekly_digest}
          />
        </div>

        {state.error && (
          <p className="text-sm text-destructive">{state.error.message}</p>
        )}
        {state.success && (
          <p className="text-sm text-green-600">Preferences saved</p>
        )}

        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving..." : "Save Preferences"}
        </Button>
      </form>
    </div>
  );
}
