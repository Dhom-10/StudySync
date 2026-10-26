"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useLocalAuth } from "@/hooks/use-local-auth";
import { cn } from "@/lib/utils";

const BARS = [14, 25, 35, 22, 42, 28, 18, 30, 39, 46, 29, 21, 36, 44, 50, 31, 20, 39, 48, 34, 25, 42, 31, 46, 37, 23, 39, 49, 33, 21, 37, 29, 18];

const TRANSCRIPT = [
  { time: "23:41", text: "So the light reactions happen in the thylakoid membrane. That is where water gets split." },
  { time: "23:52", text: "The Calvin cycle then uses that ATP and NADPH to build sugar." },
];

export default function DashboardPage() {
  const router = useRouter();
  const { status, logout } = useLocalAuth();
  const [recording, setRecording] = useState(true);
  const [summarized, setSummarized] = useState(false);
  const [taskDone, setTaskDone] = useState(false);

  useEffect(() => {
    if (status === "out") router.replace("/login");
  }, [status, router]);

  if (status !== "in") return null;

  return (
    <div className="flex min-h-screen justify-center bg-background p-4 sm:p-8">
      <div className="flex w-full max-w-[1280px] flex-col overflow-hidden border border-foreground/10 bg-card">
        <SiteHeader>
          <button
            type="button"
            onClick={logout}
            className="text-sm font-medium underline decoration-transparent decoration-2 underline-offset-4 transition-colors hover:decoration-highlight"
          >
            Log out
          </button>
        </SiteHeader>

        <div className="flex h-12 items-center gap-5 border-b border-foreground/10 px-6 sm:px-14">
          <span className="label-mono normal-case tracking-normal">StudySync · Biology 201, Lecture 9</span>
        </div>

        <div className="grid flex-1 grid-cols-1 lg:grid-cols-2">
          <section className="min-w-0 px-6 py-8 sm:px-14 lg:border-r lg:border-foreground/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-lg">
                <span className={cn("size-3.5 rounded-full", recording ? "bg-destructive" : "bg-muted-foreground/50")} />
                <strong>{recording ? "Recording" : "Paused"}</strong>
              </div>
              <span className="label-mono text-base text-foreground">{recording ? "24:07" : "24:08"}</span>
            </div>

            <div
              aria-label="Audio waveform"
              className={cn("my-4 flex h-[72px] items-center gap-1 overflow-hidden", !recording && "opacity-40")}
            >
              {BARS.map((h, i) => (
                <i key={i} className="w-1 shrink-0 rounded-full bg-foreground" style={{ height: h }} />
              ))}
              <span className="mx-[3px] h-[53px] w-[5px] shrink-0 rounded-full bg-destructive" />
              {Array.from({ length: 10 }).map((_, i) => (
                <b key={i} className="size-[5px] shrink-0 rounded-full bg-foreground/20" />
              ))}
            </div>

            <h2 className="label-mono mb-2">Live transcript</h2>
            <div className="grid gap-3">
              {TRANSCRIPT.map((row) => (
                <div key={row.time} className="grid grid-cols-[58px_1fr] gap-2.5 leading-snug">
                  <time className="label-mono pt-0.5 normal-case tracking-normal">{row.time}</time>
                  <p>{row.text}</p>
                </div>
              ))}
              <div className="grid grid-cols-[58px_1fr] gap-2.5 leading-snug">
                <time className="label-mono pt-0.5 normal-case tracking-normal">24:03</time>
                <p>
                  Quick reminder: <mark className="bg-highlight px-0.5">the lab report is due next Friday</mark>, and
                  chapter 8 is on the quiz.
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="h-auto gap-2.5 px-5 py-3" onClick={() => setRecording((r) => !r)}>
                <span className="size-2.5 rounded-[2px] bg-current" />
                {recording ? "Stop" : "Resume"}
              </Button>
              <Button className="h-auto px-5 py-3" onClick={() => setSummarized(true)}>
                {summarized ? "Summary saved" : "Summarize"}
              </Button>
            </div>
          </section>

          <section className="min-w-0 border-t border-foreground/10 px-6 py-8 sm:px-14 lg:border-t-0">
            <div className="mb-5 flex items-start justify-between gap-5">
              <h1 className="font-display text-3xl font-extrabold tracking-[-0.02em]">Summary</h1>
              <p className={cn("flex items-center gap-1.5 text-sm font-medium", summarized && "text-highlight-foreground")}>
                <Check className="size-4" /> {summarized ? "Summary updated" : "Saved to your account"}
              </p>
            </div>

            <h2 className="label-mono mb-2">Topics</h2>
            <div className="flex flex-wrap gap-2">
              {["Photosynthesis", "Light reactions", "Calvin cycle"].map((t) => (
                <span key={t} className="rounded-full border-2 border-foreground px-3.5 py-0.5 text-sm font-medium">
                  {t}
                </span>
              ))}
            </div>

            <h2 className="label-mono mt-5 mb-2">Key points</h2>
            <ul className="grid gap-1.5">
              {["Light reactions split water and make ATP and NADPH.", "The Calvin cycle uses both to build sugar."].map((p) => (
                <li key={p} className="relative pl-5 leading-snug before:absolute before:top-[0.55em] before:left-px before:size-1.5 before:bg-foreground">
                  {p}
                </li>
              ))}
            </ul>

            <div className="mt-6 grid gap-8 sm:grid-cols-2">
              <div>
                <h2 className="label-mono mb-2">Assignments</h2>
                <strong className="mb-1.5 block">Lab report</strong>
                <span className="label-mono inline-block rounded-[6px] border-2 border-foreground bg-highlight px-2.5 py-0.5 font-bold text-foreground normal-case tracking-normal">
                  Due Fri, Oct 16
                </span>
              </div>
              <div>
                <h2 className="label-mono mb-2">Tasks</h2>
                <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug">
                  <input
                    type="checkbox"
                    checked={taskDone}
                    onChange={(e) => setTaskDone(e.target.checked)}
                    className="mt-px size-[18px] shrink-0 accent-foreground"
                  />
                  <span className={cn(taskDone && "text-muted-foreground line-through")}>
                    Review chapter 8 before the quiz
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="label-mono mb-2">Study tip</h2>
              <p className="text-sm leading-snug">
                Sketch the two stages side by side and label what goes in and what comes out.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
