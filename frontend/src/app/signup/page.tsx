"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { GoogleIcon } from "@/components/google-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSignup } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const signup = useSignup();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    signup.mutate(
      { name, email, password },
      {
        onError: (err) => {
          setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
        },
      }
    );
  }

  return (
    <div className="flex min-h-screen justify-center bg-background p-4 sm:p-8">
      <div className="flex w-full max-w-[1280px] flex-col overflow-hidden border border-foreground/10 bg-card">
        <SiteHeader>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium underline decoration-transparent decoration-2 underline-offset-4 transition-colors hover:decoration-highlight"
          >
            <ArrowLeft className="size-4" /> Back
          </Link>
        </SiteHeader>

        <div className="grid flex-1 grid-cols-1 lg:grid-cols-2">
          <div className="flex flex-col justify-center px-6 py-16 sm:px-14">
            <div className="w-full max-w-sm">
              <h1 className="font-display text-3xl font-extrabold tracking-[-0.02em]">Create your account</h1>
              <p className="mt-2 text-muted-foreground">Start turning lectures into study guides.</p>

              <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ada Lovelace"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@school.edu"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="h-auto w-full py-3 text-base" disabled={signup.isPending}>
                  {signup.isPending && <Loader2 className="size-4 animate-spin" />}
                  Sign up
                </Button>
              </form>

              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border/10" />
                or
                <span className="h-px flex-1 bg-border/10" />
              </div>

              <Button variant="outline" className="h-auto w-full gap-2.5 py-3 text-base">
                <GoogleIcon className="size-4.5" />
                Continue with Google
              </Button>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-foreground underline decoration-transparent decoration-2 underline-offset-4 transition-colors hover:decoration-highlight"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>

          <div className="relative hidden overflow-hidden border-l border-foreground/10 bg-highlight lg:flex lg:flex-col lg:justify-end">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(17,17,17,0.08)_0px,rgba(17,17,17,0.08)_2px,transparent_2px,transparent_16px)]"
            />
            <div className="relative z-10 flex flex-col gap-6 p-14">
              <span className="label-mono">StudySync</span>
              <h2 className="font-display text-5xl leading-[1.05] font-extrabold tracking-[-0.02em] [font-stretch:75%]">
                Stop writing.
                <br />
                Start listening.
              </h2>
              <p className="max-w-sm text-lg leading-snug">
                Record your class, get a live transcript, and a plain-language summary when it ends.
              </p>
              <Button render={<Link href="/#how-it-works" />} nativeButton={false} variant="outline" className="h-auto w-fit px-6 py-3">
                See how it works
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
