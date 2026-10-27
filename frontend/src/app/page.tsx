"use client";

import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { FitText } from "@/components/landing/fit-text";
import { LiveDemoWindow } from "@/components/landing/live-demo";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { WritingGroup, WritingText, WritingWord, writingDelays } from "@/components/ui/writing-text";
import { cn } from "@/lib/utils";

// Sections fill the screen (dvh = real visible height, even with mobile browser bars).
// The hero starts below the page margin and the frame's 1px border, so it is shorter by exactly that much:
// its bottom edge then lands on the bottom of the screen and nothing from the next section peeks in.
const HERO_SCREEN = "min-h-[calc(100dvh-0.75rem-1px)] sm:min-h-[calc(100dvh-1rem-1px)]";
// The last section keeps the page margin below it as well.
const SCREEN = "min-h-[calc(100dvh-1.5rem)] sm:min-h-[calc(100dvh-2rem)]";

// Hero headline: each word rises in after the previous one (longer words and full stops add a pause).
const HERO_RISE_MS = 1000;
const HERO_DELAYS = writingDelays(["Stop", "writing.", "Start", "listening."], 70, 200);

function scrollToDemo(e: React.MouseEvent) {
  e.preventDefault();
  const el = document.getElementById("how-it-works");
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "smooth" });
}

export default function RootPage() {
  return <LandingPage />;
}

function LandingPage() {
  return (
    <div className="flex min-h-dvh bg-background p-3 sm:p-4">
      <div className="w-full overflow-hidden rounded-[22px] border border-foreground/10 bg-card">
        <section className={cn(HERO_SCREEN, "flex flex-col")}>
          <Nav />
          <Hero />
        </section>
        <WindowBand />
        <section className={cn(SCREEN, "flex flex-col border-t border-foreground/10")}>
          <FeatureGrid />
          <ClosingCta />
          <Footer />
        </section>
      </div>
    </div>
  );
}

function Nav() {
  return (
    <SiteHeader>
      <div className="flex items-center gap-6 text-[15px] font-medium sm:gap-8">
        <a
          href="#how-it-works"
          onClick={scrollToDemo}
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
      <h1
        aria-label="Stop writing. Start listening."
        className="font-display text-[44px] leading-[1] font-extrabold tracking-[-0.02em] [font-stretch:75%] sm:text-[80px] lg:text-[120px] xl:text-[140px]"
      >
        <WritingGroup>
        <div aria-hidden="true">
          <WritingWord delay={HERO_DELAYS[0]} duration={HERO_RISE_MS}>
            Stop
          </WritingWord>{" "}
          <WritingWord delay={HERO_DELAYS[1]} duration={HERO_RISE_MS}>
            <span className="relative inline-block">
              writing.
              {/* the strike-through is drawn across the word once it has landed */}
              <span
                className="writing-text-draw absolute inset-x-0 top-1/2 h-[6px] bg-destructive sm:h-[8px] xl:h-[11px]"
                style={{ "--writing-text-delay": `${HERO_DELAYS[1] + HERO_RISE_MS * 0.7}ms` } as React.CSSProperties}
              />
            </span>
          </WritingWord>
        </div>
        <div className="mt-1.5" aria-hidden="true">
          <WritingWord delay={HERO_DELAYS[2]} duration={HERO_RISE_MS}>
            Start
          </WritingWord>{" "}
          <WritingWord delay={HERO_DELAYS[3]} duration={HERO_RISE_MS}>
            <mark className="inline-block -rotate-[1.5deg] bg-highlight px-3 text-foreground sm:px-4 xl:px-5">
              listening.
            </mark>
          </WritingWord>
        </div>
        </WritingGroup>
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
    <section id="how-it-works" className="flex min-h-dvh items-center justify-center bg-highlight px-4 sm:px-10">
      <div className="w-full max-w-[1240px]">
        <LiveDemoWindow />
      </div>
    </section>
  );
}

const FEATURES = [
  { n: "01", label: "Record", title: "One tap to start", body: "Live transcript with timestamps, so you can stay in the lecture." },
  { n: "02", label: "Summarize", title: "Topics and key points", body: "Deadlines and tasks are pulled out and highlighted for you." },
  { n: "03", label: "Review", title: "Saved to your account", body: "Every lecture, organized by course and ready before the quiz." },
];

function FeatureGrid() {
  return (
    <div className="grid flex-1 grid-cols-1 border-b border-foreground/10 sm:grid-cols-3">
      {FEATURES.map((f, i) => (
        <div
          key={f.n}
          className={cn(
            "flex flex-col justify-center gap-3 border-foreground/10 px-6 py-12 sm:px-10",
            i < FEATURES.length - 1 && "border-b sm:border-r sm:border-b-0"
          )}
        >
          <span className="font-display text-7xl leading-none font-extrabold tracking-[-0.04em] text-foreground/15 [font-stretch:75%] sm:text-8xl">
            {f.n}
          </span>
          <span className="label-mono">{f.label}</span>
          <b className="font-display text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
            <WritingText text={f.title} />
          </b>
          <span className="max-w-sm text-lg leading-[1.45] sm:text-xl">{f.body}</span>
        </div>
      ))}
    </div>
  );
}

function ClosingCta() {
  return (
    <div className="flex flex-col items-start justify-between gap-6 px-6 py-14 sm:flex-row sm:items-center sm:px-14 sm:py-16">
      <h2 className="font-display text-4xl leading-[1] font-extrabold tracking-[-0.02em] [font-stretch:75%] sm:text-[60px]">
        <WritingText text={"Stop taking notes.\nStart understanding."} speed={40} />
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

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="label-mono">{title}</span>
      <ul className="flex flex-col gap-2 text-[15px]">{children}</ul>
    </div>
  );
}

const footerLink =
  "underline decoration-transparent decoration-2 underline-offset-4 transition-colors hover:decoration-highlight";

function Footer() {
  return (
    <footer className="overflow-hidden border-t border-foreground/10">
      <div className="grid gap-10 px-6 py-12 sm:grid-cols-2 sm:px-14 lg:grid-cols-4">
        <div className="flex flex-col gap-4">
          <BrandMark />
          <p className="max-w-xs text-[15px] leading-snug text-muted-foreground">
            Record the lecture. Keep the understanding.
          </p>
        </div>
        <FooterColumn title="Product">
          <li>
            <a href="#how-it-works" onClick={scrollToDemo} className={footerLink}>
              How it works
            </a>
          </li>
          <li>
            <Link href="/login" className={footerLink}>
              Log in
            </Link>
          </li>
          <li>
            <Link href="/login" className={footerLink}>
              Start free
            </Link>
          </li>
        </FooterColumn>
        <FooterColumn title="Under the hood">
          <li>Whisper for speech recognition</li>
          <li>Ollama for the summaries</li>
          <li>SQLite for your sessions</li>
        </FooterColumn>
        <FooterColumn title="Private by design">
          <li>Runs on your own machine</li>
          <li>Audio never leaves your laptop</li>
          <li>No cloud accounts, no API keys</li>
        </FooterColumn>
      </div>

      {/* Scaled to the exact width of the footer, so the left and right margins are equal. */}
      <div aria-hidden="true" className="select-none px-6 sm:px-14">
        <FitText className="font-display leading-[0.78] font-extrabold tracking-[-0.04em] text-foreground/[0.07] [font-stretch:75%]">
          StudySync
        </FitText>
      </div>

      <div className="label-mono flex flex-wrap justify-between gap-2 border-t border-foreground/10 px-6 py-5 normal-case tracking-normal sm:px-14">
        <span>© StudySync · Made for students</span>
        <span>Built with Whisper and Ollama</span>
      </div>
    </footer>
  );
}
