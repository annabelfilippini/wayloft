import Link from "next/link";
import { signIn } from "@/app/actions/auth";
import { SubmitButton } from "@/components/auth/submit-button";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Input } from "@/components/ui/input";


export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; redirectTo?: string }>;
}) {
  const { error, success, redirectTo } = await searchParams;

  return (
    <div className="flex min-h-screen">
      {/* Left — Brand panel */}
      <div
        className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-background p-10 lg:flex xl:p-14"
      >
        {/* Contrail SVG */}
        <div className="pointer-events-none absolute inset-0">
          <svg
            viewBox="0 0 800 900"
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            <defs>
              <linearGradient id="login-trail" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#D4A020" stopOpacity="0" />
                <stop offset="40%" stopColor="#D4A020" stopOpacity="0.06" />
                <stop offset="70%" stopColor="#D4A020" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#D4A020" stopOpacity="0.18" />
              </linearGradient>
              <linearGradient id="login-glow" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#D4A020" stopOpacity="0" />
                <stop offset="50%" stopColor="#D4A020" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#D4A020" stopOpacity="0.07" />
              </linearGradient>
              <filter id="login-wispy" x="-20%" y="-40%" width="140%" height="180%">
                <feTurbulence type="fractalNoise" baseFrequency="0.012 0.003" numOctaves={4} seed={7} result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale={10} xChannelSelector="R" yChannelSelector="G" />
              </filter>
              <g id="login-plane">
                <ellipse cx="0" cy="0" rx="10" ry="2" fill="#D4A020" opacity="0.35" />
                <line x1="-2" y1="-8" x2="3" y2="8" stroke="#D4A020" strokeWidth="1.5" opacity="0.3" />
                <line x1="-8" y1="-4" x2="-5" y2="4" stroke="#D4A020" strokeWidth="1" opacity="0.25" />
              </g>
            </defs>
            <path d="M -20,750 C 150,680 350,500 750,195" stroke="url(#login-glow)" strokeWidth="18" fill="none" strokeLinecap="round" filter="url(#login-wispy)" />
            <path d="M -20,750 C 150,680 350,500 750,195" stroke="url(#login-trail)" strokeWidth="2.5" fill="none" strokeLinecap="round" filter="url(#login-wispy)" />
            <path d="M -20,770 C 150,700 350,520 750,210" stroke="url(#login-glow)" strokeWidth="18" fill="none" strokeLinecap="round" filter="url(#login-wispy)" />
            <path d="M -20,770 C 150,700 350,520 750,210" stroke="url(#login-trail)" strokeWidth="2.5" fill="none" strokeLinecap="round" filter="url(#login-wispy)" />
            {/* Plane silhouette — centered between trails, slightly ahead */}
            <use href="#login-plane" x="770" y="190" transform="rotate(-15, 770, 190)" />
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

      {/* Right — Sign in form */}
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
            Sign in
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter your email to sign in to your account.
          </p>

          <div className="mt-8 flex flex-col gap-5">
            {error && (
              <div className="bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
                {success}
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

            <form action={signIn} className="flex flex-col gap-4">
              <input
                type="hidden"
                name="redirectTo"
                value={redirectTo ?? ""}
              />
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
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
              <SubmitButton className="w-full">Sign in</SubmitButton>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-foreground hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
