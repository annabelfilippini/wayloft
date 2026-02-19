import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  return (
    <AuthForm
      title="Check your email"
      description="We sent you a confirmation link. Click it to verify your account."
    >
      <p className="text-sm text-muted-foreground">
        Didn&apos;t receive an email? Check your spam folder or try signing up
        again.
      </p>
      <Button variant="outline" className="w-full" asChild>
        <Link href="/login">Back to sign in</Link>
      </Button>
    </AuthForm>
  );
}
