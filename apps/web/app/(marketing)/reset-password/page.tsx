import { resetPassword } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthForm
      title="Set new password"
      description="Enter your new password below."
      error={error}
    >
      <form action={resetPassword} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium">
            New password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="confirm_password" className="text-sm font-medium">
            Confirm password
          </label>
          <Input
            id="confirm_password"
            name="confirm_password"
            type="password"
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <SubmitButton className="w-full">Update password</SubmitButton>
      </form>
    </AuthForm>
  );
}
