"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useLocalAuth } from "@/hooks/use-local-auth";

export default function LoginPage() {
  const router = useRouter();
  const { status, login } = useLocalAuth();

  useEffect(() => {
    if (status === "in") router.replace("/dashboard");
  }, [status, router]);

  if (status !== "out") return null;

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
              <h1 className="font-display text-3xl font-extrabold tracking-[-0.02em]">Log in to StudySync</h1>
              <p className="mt-2 text-muted-foreground">Pick up where you left off.</p>

              <Button
                onClick={login}
                className="mt-8 h-auto w-full py-3 text-base"
              >
                Log in
              </Button>
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
