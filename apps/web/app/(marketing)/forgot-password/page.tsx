import Link from "next/link";
import { forgotPassword } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  return (
    <AuthForm
      title="Reset password"
      description="Enter your email and we'll send you a reset link."
      error={error}
      success={success}
    >
      <form action={forgotPassword} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>
        <SubmitButton className="w-full">Send reset link</SubmitButton>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </AuthForm>
  );
}
