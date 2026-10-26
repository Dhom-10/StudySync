"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useLocalAuth } from "@/hooks/use-local-auth";

function scrollToDemo(e: React.MouseEvent) {
  e.preventDefault();
  const el = document.getElementById("how-it-works");
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 92;
  window.scrollTo({ top, behavior: "smooth" });
}

export default function RootPage() {
  return <LandingPage />;
}

function LandingPage() {
  return (
    <div className="flex min-h-screen justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-[1280px] overflow-hidden border border-foreground/10 bg-card">
        <div className="flex min-h-[calc(100vh-1rem)] flex-col sm:min-h-[calc(100vh-2rem)]">
          <Nav />
          <Hero />
        </div>
        <WindowBand />
        <FeatureGrid />
        <ClosingCta />
        <Footer />
      </div>
    </div>
  );
}

function Nav() {
  const { status } = useLocalAuth();
  const loggedIn = status === "in";
  return (
    <SiteHeader>
      <div className="flex items-center gap-6 text-[15px] font-medium sm:gap-8">
        <a
          href={loggedIn ? "/dashboard" : "#how-it-works"}
          onClick={loggedIn ? undefined : scrollToDemo}
          className="hidden underline decoration-transparent decoration-2 underline-offset-4 transition-colors hover:decoration-highlight sm:inline"
        >
          How it works
        </a>
        <Button render={<Link href="/login" />} nativeButton={false} className="h-auto px-5 py-2.5 text-[15px]">
          Start free
        </Button>
      </div>
    </SiteHeader>
  );
}

function Hero() {
  return (
    <div className="flex flex-1 flex-col items-start justify-center gap-6 px-6 py-12 sm:px-14">
      <h1 className="font-display text-[44px] leading-[1] font-extrabold tracking-[-0.02em] [font-stretch:75%] sm:text-[80px] lg:text-[120px] xl:text-[140px]">
        <div>
          Stop{" "}
          <span className="relative inline-block">
            writing.
            <span className="absolute inset-x-0 top-1/2 h-[6px] bg-destructive sm:h-[8px] xl:h-[11px]" aria-hidden="true" />
          </span>
        </div>
        <div className="mt-1.5">
          Start{" "}
          <mark className="inline-block -rotate-[1.5deg] bg-highlight px-3 text-foreground sm:px-4 xl:px-5">
            listening.
          </mark>
        </div>
      </h1>
      <p className="max-w-[620px] text-xl leading-snug sm:text-[22px]">
        StudySync records your lecture, transcribes it live, and hands you topics, key points, due
        dates and a study tip when it ends.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          render={<Link href="/login" />}
          nativeButton={false}
          size="lg"
          className="h-auto px-7 py-[18px] text-lg"
        >
          Start recording
        </Button>
        <Button
          render={<Link href="#how-it-works" />}
          nativeButton={false}
          onClick={scrollToDemo}
          size="lg"
          variant="outline"
          className="h-auto px-7 py-[18px] text-lg"
        >
          See an example
        </Button>
      </div>
    </div>
  );
}

function WindowBand() {
  return (
    <div className="flex justify-center border-t border-b border-foreground/10 bg-highlight px-6 py-16 sm:px-14 sm:py-20">
      <div className="w-full max-w-[935px]">
        <StudyWindowPreview />
      </div>
    </div>
  );
}

const TRANSCRIPT_LINES = [
  { time: "23:41", text: "So the light reactions happen in the thylakoid membrane. That is where water gets split." },
  { time: "23:52", text: "The Calvin cycle then uses that ATP and NADPH to build sugar." },
];

const BARS = Array.from({ length: 44 }, (_, i) => {
  const live = i < 32;
  const h = live ? 10 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)) * 44 : 4;
  return { h: Math.round(h), live };
});

function StudyWindowPreview() {
  return (
    <div
      id="how-it-works"
      className="overflow-hidden rounded-[22px] border border-foreground/10 bg-card shadow-[0_10px_0_var(--highlight)]"
    >
      <div className="flex items-center gap-5 border-b border-foreground/10 px-5 py-3.5">
        <div className="flex gap-[7px]">
          <span className="size-[18px] rounded-full border-2 border-foreground" />
          <span className="size-[18px] rounded-full border-2 border-foreground" />
          <span className="size-[18px] rounded-full border-2 border-foreground" />
        </div>
        <span className="label-mono normal-case tracking-normal text-foreground">
          StudySync · Biology 201, Lecture 9
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <div className="flex flex-col gap-[18px] border-b border-foreground/10 p-6 sm:border-r sm:border-b-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-lg font-bold">
              <span className="size-3.5 rounded-full bg-destructive" />
              Recording
            </div>
            <b className="font-mono text-[17px] font-medium">24:07</b>
          </div>
          <div className="flex h-16 items-end gap-1">
            {BARS.map((bar, i) => (
              <span
                key={i}
                className={bar.live ? "w-1 rounded-sm bg-foreground" : "w-1 rounded-sm bg-border/30"}
                style={{ height: bar.h }}
              />
            ))}
          </div>
          <div className="label-mono">Live transcript</div>
          <div className="flex flex-col gap-3.5 text-[15px] leading-snug sm:text-base">
            {TRANSCRIPT_LINES.map((line) => (
              <div key={line.time} className="flex gap-4">
                <span className="pt-0.5 font-mono text-[13px] text-muted-foreground">{line.time}</span>
                <span>{line.text}</span>
              </div>
            ))}
            <div className="flex gap-4">
              <span className="pt-0.5 font-mono text-[13px] text-muted-foreground">24:03</span>
              <span>
                Quick reminder:{" "}
                <mark className="rounded-[3px] bg-highlight px-1.5 text-foreground">
                  the lab report is due next Friday
                </mark>
                , and chapter 8 is on the quiz.
              </span>
            </div>
          </div>
          <div className="mt-1 flex gap-3">
            <Button variant="outline" className="h-auto gap-2.5 px-5 py-3 text-base">
              <span className="size-2.5 bg-foreground" /> Stop
            </Button>
            <Button className="h-auto px-5 py-3 text-base">Summarize</Button>
          </div>
        </div>
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-baseline justify-between">
            <b className="text-[26px] tracking-[-0.01em]">Summary</b>
            <span className="text-[13px] font-medium">✓ Saved to your account</span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="label-mono">Topics</div>
            <div className="flex flex-wrap gap-2">
              {["Photosynthesis", "Light reactions", "Calvin cycle"].map((t) => (
                <span key={t} className="rounded-full border-2 border-foreground px-3.5 py-1 text-sm font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="label-mono">Key points</div>
            <div className="flex gap-2.5 text-[15px]">
              <span className="mt-2 size-[7px] shrink-0 bg-foreground" />
              Light reactions split water and make ATP and NADPH.
            </div>
            <div className="flex gap-2.5 text-[15px]">
              <span className="mt-2 size-[7px] shrink-0 bg-foreground" />
              The Calvin cycle uses both to build sugar.
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <div className="label-mono">Assignments</div>
              <b className="text-[15px]">Lab report</b>
              <span className="label-mono w-fit rounded-[6px] border-2 border-foreground bg-highlight px-2.5 py-1 tracking-[0.04em] text-foreground">
                Due Fri, Oct 16
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="label-mono">Tasks</div>
              <div className="flex gap-2.5 text-[15px]">
                <span className="mt-0.5 size-[15px] shrink-0 rounded-[3px] border-2 border-foreground" />
                Review chapter 8 before the quiz
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="label-mono">Study tip</div>
            <span className="text-[15px] leading-snug">
              Sketch the two stages side by side and label what goes in and what comes out.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  { n: "01", label: "Record", title: "One tap to start", body: "Live transcript with timestamps, so you can stay in the lecture." },
  { n: "02", label: "Summarize", title: "Topics and key points", body: "Deadlines and tasks are pulled out and highlighted for you." },
  { n: "03", label: "Review", title: "Saved to your account", body: "Every lecture, organized by course and ready before the quiz." },
];

function FeatureGrid() {
  return (
    <div className="grid grid-cols-1 border-b border-foreground/10 sm:grid-cols-3">
      {FEATURES.map((f, i) => (
        <div
          key={f.n}
          className={
            "flex flex-col gap-2.5 border-foreground/10 px-6 py-10 sm:px-8" +
            (i < FEATURES.length - 1 ? " border-b sm:border-r sm:border-b-0" : "")
          }
        >
          <span className="label-mono">
            {f.n} · {f.label}
          </span>
          <b className="font-display text-2xl font-extrabold tracking-[-0.02em] sm:text-[30px]">{f.title}</b>
          <span className="text-[17px] leading-[1.45]">{f.body}</span>
        </div>
      ))}
    </div>
  );
}

function ClosingCta() {
  return (
    <div className="flex flex-col items-start justify-between gap-6 px-6 py-14 sm:flex-row sm:items-center sm:px-14 sm:py-[72px]">
      <h2 className="font-display text-4xl leading-[1] font-extrabold tracking-[-0.02em] [font-stretch:75%] sm:text-[60px]">
        Stop taking notes.
        <br />
        Start understanding.
      </h2>
      <Button
        render={<Link href="/login" />}
        nativeButton={false}
        size="lg"
        className="h-auto px-8 py-[18px] text-xl"
      >
        Start free
      </Button>
    </div>
  );
}

function Footer() {
  return (
    <div className="label-mono flex justify-between border-t border-foreground/10 px-6 py-5 normal-case tracking-normal sm:px-14">
      <span>© StudySync</span>
      <span>Privacy · Terms</span>
    </div>
  );
}
