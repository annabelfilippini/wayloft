import Link from "next/link";
import { signUp } from "@/app/actions/auth";
import { SubmitButton } from "@/components/auth/submit-button";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Input } from "@/components/ui/input";


export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen">
      {/* Left — Brand panel */}
      <div
        className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r bg-background p-10 lg:flex xl:p-14"
      >
        {/* Contrail SVG */}
        <div className="pointer-events-none absolute inset-0">
          <svg
            viewBox="0 0 800 900"
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            <defs>
              <linearGradient id="signup-trail" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#D4A020" stopOpacity="0" />
                <stop offset="40%" stopColor="#D4A020" stopOpacity="0.06" />
                <stop offset="70%" stopColor="#D4A020" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#D4A020" stopOpacity="0.18" />
              </linearGradient>
              <linearGradient id="signup-glow" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#D4A020" stopOpacity="0" />
                <stop offset="50%" stopColor="#D4A020" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#D4A020" stopOpacity="0.07" />
              </linearGradient>
              <filter id="signup-wispy" x="-20%" y="-40%" width="140%" height="180%">
                <feTurbulence type="fractalNoise" baseFrequency="0.012 0.003" numOctaves={4} seed={11} result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale={10} xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>
            <path d="M -20,750 C 150,680 350,500 780,180" stroke="url(#signup-glow)" strokeWidth="18" fill="none" strokeLinecap="round" filter="url(#signup-wispy)" />
            <path d="M -20,750 C 150,680 350,500 780,180" stroke="url(#signup-trail)" strokeWidth="2.5" fill="none" strokeLinecap="round" filter="url(#signup-wispy)" />
            <path d="M -20,770 C 150,700 350,520 780,200" stroke="url(#signup-glow)" strokeWidth="18" fill="none" strokeLinecap="round" filter="url(#signup-wispy)" />
            <path d="M -20,770 C 150,700 350,520 780,200" stroke="url(#signup-trail)" strokeWidth="2.5" fill="none" strokeLinecap="round" filter="url(#signup-wispy)" />
          </svg>
        </div>

        <div className="relative z-10">
          <Link
            href="/"
            className="mono text-[15px] font-bold tracking-[-0.04em] text-primary"
          >
            WAYLOFT
          </Link>
        </div>

        <div className="relative z-10">
          <h1 className="text-[clamp(2rem,4vw,3.25rem)] font-medium leading-[1.1] tracking-[-0.02em] text-foreground">
            Your points,
            <br />
            properly spent.
          </h1>
        </div>

        <p className="relative z-10 text-[13px] text-muted-foreground/40">
          &copy; {new Date().getFullYear()} Wayloft
        </p>
      </div>

      {/* Right — Sign up form */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <Link
            href="/"
            className="mono mb-10 block text-[15px] font-bold tracking-[-0.04em] text-primary lg:hidden"
          >
            WAYLOFT
          </Link>

          <h2 className="text-2xl font-semibold tracking-[-0.01em]">
            Create an account
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter your details to get started.
          </p>

          <div className="mt-8 flex flex-col gap-5">
            {error && (
              <div className="bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <OAuthButtons />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or
                </span>
              </div>
            </div>

            <form action={signUp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="full_name" className="text-sm font-medium">
                  Full name
                </label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="Jane Doe"
                  required
                  autoComplete="name"
                />
              </div>
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
              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
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
              <SubmitButton className="w-full">Create account</SubmitButton>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-foreground hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
