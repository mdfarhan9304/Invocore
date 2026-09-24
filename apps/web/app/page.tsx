import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  CircleDollarSign,
  FileCheck2,
  FileText,
  Layers3,
  LockKeyhole,
  LogIn,
  ReceiptText,
  Send,
  Sparkles,
  UsersRound
} from "lucide-react";

import { Reveal } from "@/components/marketing/reveal";
import { Button } from "@/components/ui/button";

const workflowItems = [
  { label: "Brand direction", amount: "$1,800", width: "w-[72%]" },
  { label: "Website build", amount: "$4,200", width: "w-[88%]" }
];

const featureCards = [
  {
    icon: UsersRound,
    eyebrow: "Client records",
    title: "Keep the details close.",
    copy: "Names, addresses, tax IDs, and notes stay ready for the next invoice.",
    detail: "Searchable client list"
  },
  {
    icon: Layers3,
    eyebrow: "Products & services",
    title: "Stop retyping the work.",
    copy: "Keep your usual offerings, pricing, and tax rates ready to add again.",
    detail: "Reusable line items"
  },
  {
    icon: ReceiptText,
    eyebrow: "Invoice lifecycle",
    title: "Make every status intentional.",
    copy: "Move a draft to issued, then sent, without losing the thread of what happened.",
    detail: "Draft · Issued · Sent"
  }
];

const integrityPoints = [
  {
    label: "Integer money",
    value: "$4,200.00",
    description: "Amounts stay precise from line item to PDF."
  },
  {
    label: "Safe edits",
    value: "v1 → v2",
    description: "Version checks protect work in progress."
  },
  {
    label: "Clear numbering",
    value: "INV-2026-00018",
    description: "Each workspace gets a clean yearly sequence."
  }
];

function IsometricStage() {
  return (
    <div className="iso-stage" aria-hidden="true">
      <div className="iso-platform">
        <div className="iso-platform-grid" />
        <span className="iso-platform-label iso-platform-label-clients">clients</span>
        <span className="iso-platform-label iso-platform-label-invoices">invoices</span>
        <span className="iso-platform-label iso-platform-label-catalog">catalog</span>
      </div>
      <div className="iso-invoice-card">
        <div className="flex items-center justify-between border-b border-[#17352d]/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-md bg-[#e1f1e5] text-[#3c7560]">
              <FileText className="size-3" />
            </span>
            <span className="text-[9px] font-bold text-[#17352d]">Invoice</span>
          </div>
          <span className="font-mono text-[8px] text-[#789087]">INV-2026-00018</span>
        </div>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-[8px] text-[#60756c]">
            <span>Northstar Studio</span>
            <span className="font-semibold text-[#17352d]">$6,510</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[#e7eee8]">
            <div className="h-full w-[78%] rounded-full bg-[#79b38e]" />
          </div>
          <div className="flex items-center justify-between text-[8px] text-[#8aa094]">
            <span>2 line items</span>
            <span className="rounded-full bg-[#e1f1e5] px-1.5 py-0.5 font-semibold text-[#3c7560]">
              issued
            </span>
          </div>
        </div>
      </div>
      <div className="iso-status-card">
        <div className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-md bg-[#b8e5c4]/20 text-[#b8e5c4]">
            <Check className="size-3" />
          </span>
          <div>
            <p className="text-[9px] font-bold text-white">Ready to send</p>
            <p className="mt-0.5 text-[8px] text-[#91aba0]">Northstar Studio</p>
          </div>
        </div>
      </div>
      <div className="iso-sequence-card">
        <span className="text-[8px] font-bold tracking-[0.16em] text-[#789087] uppercase">
          Next number
        </span>
        <p className="mt-1 font-mono text-sm font-semibold text-[#17352d]">INV-2026-00019</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f8fafc] text-slate-950">
      <section className="relative isolate mx-3 mt-3 mb-3 flex min-h-[calc(100vh-1.5rem)] items-stretch overflow-hidden rounded-[28px] sm:mx-5 sm:mt-5 sm:mb-5 sm:min-h-[calc(100vh-2.5rem)] sm:rounded-[36px] lg:mx-6 lg:mt-6 lg:mb-6 lg:min-h-[calc(100vh-3rem)] lg:rounded-[42px]">
        <Image
          src="/images/invocore-hero-landscape.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 object-cover object-center"
        />
        <div className="mx-auto flex w-full max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
          <header className="flex items-center justify-between">
            <Link href="/" className="group flex items-center gap-3" aria-label="Invocore home">
              <span className="grid size-9 place-items-center rounded-lg border border-emerald-900/10 bg-white/75 text-sm font-semibold text-emerald-950 shadow-sm backdrop-blur transition-transform duration-300 group-hover:-rotate-3">
                I
              </span>
              <span className="text-base font-semibold tracking-[0.18em] text-emerald-950 uppercase">
                Invocore
              </span>
            </Link>

            <nav className="flex items-center gap-2" aria-label="Landing page">
              <Button
                asChild
                variant="ghost"
                className="hidden text-emerald-950 hover:bg-white/55 hover:text-emerald-950 sm:inline-flex"
              >
                <Link href="/login">
                  <LogIn aria-hidden="true" />
                  Log in
                </Link>
              </Button>
              <Button asChild className="hero-cta button-lift">
                <Link href="/register">
                  Start
                  <ArrowRight
                    className="transition-transform duration-300 group-hover/button:translate-x-0.5"
                    data-icon="inline-end"
                  />
                </Link>
              </Button>
            </nav>
          </header>

          <div className="hero-enter grid flex-1 items-center gap-14 pb-16 pt-16 sm:pt-20 lg:grid-cols-[0.86fr_1.14fr] lg:gap-8 lg:pb-20 lg:pt-24">
            <div className="max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/72 px-3 py-1 text-xs font-medium text-emerald-950/75 shadow-sm backdrop-blur">
                <FileCheck2 className="size-3.5" aria-hidden="true" />
                Calm invoice operations for growing teams
              </div>

              <h1 className="text-6xl font-semibold leading-[0.9] tracking-normal text-balance text-emerald-950 sm:text-7xl lg:text-8xl">
                Invocore
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-slate-700 sm:text-lg">
                Create consistent client invoices, move them from draft to sent, and keep the
                details in one calm workspace.
              </p>

              <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="hero-cta button-lift h-14 rounded-full px-6 text-[15px] font-bold"
                >
                  <Link href="/register">
                    Create workspace
                    <ArrowRight
                      className="transition-transform duration-300 group-hover/button:translate-x-1"
                      data-icon="inline-end"
                    />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="button-lift h-14 rounded-full border-emerald-950/15 bg-white/62 px-6 text-[15px] font-bold text-emerald-950 shadow-sm backdrop-blur hover:bg-white/82 hover:text-emerald-950"
                >
                  <Link href="/login">
                    <Sparkles
                      className="transition-transform duration-300 group-hover/button:rotate-12"
                      aria-hidden="true"
                    />
                    Open dashboard
                  </Link>
                </Button>
              </div>

              <div className="mt-10 flex max-w-lg flex-wrap items-center gap-x-5 gap-y-3 text-[11px] font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald-700" aria-hidden="true" />
                  No credit card
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald-700" aria-hidden="true" />
                  Ready in minutes
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald-700" aria-hidden="true" />
                  PDF included
                </span>
              </div>
            </div>
            <IsometricStage />
          </div>
        </div>
      </section>

      <section id="workflow" className="bg-[#f7f5ef]">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-24 lg:px-10 lg:py-32">
          <div>
            <Reveal>
              <p className="section-kicker">A focused workflow</p>
            </Reveal>
            <Reveal delay={0.06} className="mt-5">
              <h2 className="section-title max-w-md">From client list to clean invoice.</h2>
            </Reveal>
            <Reveal delay={0.12} className="mt-6 max-w-sm">
              <p className="text-base leading-7 text-[#60756c]">
                Invocore keeps the small decisions close to the work, so creating an invoice feels
                like a natural next step—not a separate project.
              </p>
            </Reveal>
            <Reveal delay={0.18} className="mt-8 space-y-4">
              {[
                "Choose a client",
                "Add products or custom line items",
                "Review totals and issue"
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm font-medium text-[#17352d]"
                >
                  <span className="grid size-6 place-items-center rounded-full border border-[#3c7560]/25 bg-[#dff2e4] text-[11px] font-bold text-[#3c7560]">
                    0{index + 1}
                  </span>
                  {item}
                </div>
              ))}
            </Reveal>
          </div>

          <Reveal delay={0.12} className="relative">
            <div className="absolute -inset-4 rounded-[32px] bg-[#dcefe2]/65 blur-2xl" />
            <div className="iso-invoice-stack relative overflow-hidden rounded-2xl border border-[#17352d]/10 bg-white shadow-[0_24px_70px_rgba(23,53,45,0.12)]">
              <div className="flex items-center justify-between border-b border-[#17352d]/10 px-5 py-4 sm:px-7">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-[#e1f1e5] text-[#3c7560]">
                    <FileText className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#17352d]">New invoice</p>
                    <p className="text-[11px] text-[#8aa094]">Draft · autosaved</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#f3f0e9] px-2.5 py-1 font-mono text-[10px] font-semibold text-[#789087]">
                  INV-2026-00018
                </span>
              </div>
              <div className="grid gap-7 p-5 sm:grid-cols-[0.75fr_1.25fr] sm:p-7">
                <div className="space-y-5">
                  <div>
                    <p className="label-detail">BILL TO</p>
                    <p className="mt-2 text-sm font-semibold text-[#17352d]">Northstar Studio</p>
                    <p className="mt-1 text-xs leading-5 text-[#8aa094]">
                      hello@northstar.studio
                      <br />
                      Portland, OR
                    </p>
                  </div>
                  <div>
                    <p className="label-detail">DUE DATE</p>
                    <p className="mt-2 text-sm font-semibold text-[#17352d]">30 Jun 2026</p>
                    <p className="mt-1 text-xs text-[#8aa094]">Net 30 terms</p>
                  </div>
                  <div className="rounded-xl border border-[#dcefe2] bg-[#f3faf4] p-3">
                    <p className="text-[11px] font-semibold text-[#3c7560]">Ready to issue</p>
                    <p className="mt-1 text-[11px] leading-4 text-[#789087]">
                      All required details are complete.
                    </p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <p className="label-detail">LINE ITEMS</p>
                    <span className="text-[11px] font-semibold text-[#3c7560]">2 items</span>
                  </div>
                  <div className="mt-3 divide-y divide-[#17352d]/10 rounded-xl border border-[#17352d]/10">
                    {workflowItems.map((item) => (
                      <div key={item.label} className="p-3.5">
                        <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[#17352d]">
                          <span>{item.label}</span>
                          <span>{item.amount}</span>
                        </div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#edf1ed]">
                          <div className={`h-full rounded-full bg-[#9cc6a8] ${item.width}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between text-[#789087]">
                      <span>Subtotal</span>
                      <span>$6,000.00</span>
                    </div>
                    <div className="flex justify-between text-[#789087]">
                      <span>Tax · 8.5%</span>
                      <span>$510.00</span>
                    </div>
                    <div className="flex justify-between border-t border-[#17352d]/10 pt-3 text-sm font-bold text-[#17352d]">
                      <span>Total</span>
                      <span>$6,510.00</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[#17352d]/10 bg-[#fbfaf6] px-5 py-4 sm:px-7">
                <div className="flex items-center gap-2 text-[11px] text-[#789087]">
                  <span className="size-1.5 rounded-full bg-[#3c7560]" />
                  Client details are scoped to your workspace.
                </div>
                <Button
                  asChild
                  className="button-lift h-8 bg-[#17352d] px-3 text-white hover:bg-[#2c5748]"
                >
                  <Link href="/register">
                    Issue invoice <Send className="size-3.5" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="features" className="border-t border-[#17352d]/10 bg-[#f7f5ef]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <Reveal>
                <p className="section-kicker">The useful essentials</p>
              </Reveal>
              <Reveal delay={0.06} className="mt-5">
                <h2 className="section-title max-w-2xl">Everything in its proper place.</h2>
              </Reveal>
            </div>
            <Reveal delay={0.12} className="max-w-xs">
              <p className="text-sm leading-6 text-[#789087]">
                No bloated suite. Just the records and actions your invoicing workflow needs.
              </p>
            </Reveal>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {featureCards.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Reveal key={feature.eyebrow} delay={0.12 + index * 0.06}>
                  <article
                    key={feature.eyebrow}
                    className="feature-card iso-feature-card group relative overflow-visible rounded-2xl border border-[#17352d]/10 bg-white p-6 transition-colors duration-300 hover:border-[#9cc6a8] hover:bg-[#fbfdf9]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="grid size-10 place-items-center rounded-xl bg-[#e1f1e5] text-[#3c7560] transition-transform duration-300 group-hover:-rotate-3">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <ArrowUpRight
                        className="size-4 text-[#a1b5aa] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#3c7560]"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="mt-8 text-[10px] font-bold tracking-[0.18em] text-[#3c7560] uppercase">
                      {feature.eyebrow}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[#17352d]">
                      {feature.title}
                    </h3>
                    <p className="mt-3 min-h-14 text-sm leading-6 text-[#789087]">{feature.copy}</p>
                    <div className="mt-7 flex items-center gap-2 border-t border-[#17352d]/10 pt-4 text-[11px] font-semibold text-[#60756c]">
                      <BadgeCheck className="size-3.5 text-[#3c7560]" aria-hidden="true" />
                      {feature.detail}
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section id="integrity" className="bg-[#17352d] text-[#f7f5ef]">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-24 lg:px-10 lg:py-32">
          <div>
            <Reveal>
              <p className="section-kicker text-[#9cc6a8]">Serious about the details</p>
            </Reveal>
            <Reveal delay={0.06} className="mt-5">
              <h2 className="max-w-md text-4xl leading-[0.98] tracking-[-0.055em] sm:text-5xl">
                A little more confidence in every number.
              </h2>
            </Reveal>
            <Reveal delay={0.12} className="mt-6 max-w-sm">
              <p className="text-base leading-7 text-[#b7c9c0]">
                The quiet safeguards behind the workflow help your invoices stay accurate as your
                work grows.
              </p>
            </Reveal>
            <Reveal
              delay={0.18}
              className="mt-8 flex items-center gap-3 text-sm font-semibold text-[#b8e5c4]"
            >
              <LockKeyhole className="size-4" aria-hidden="true" />
              Built around clear, controlled actions.
            </Reveal>
          </div>
          <div className="grid gap-3">
            {integrityPoints.map((point, index) => (
              <Reveal key={point.label} delay={0.12 + index * 0.06}>
                <div
                  key={point.label}
                  className="integrity-row group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition-all duration-300 hover:border-[#9cc6a8]/50 hover:bg-white/[0.08] sm:p-5"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#b8e5c4]/10 text-[#b8e5c4]">
                    <CircleDollarSign className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#f7f5ef]">{point.label}</p>
                    <p className="mt-1 text-xs leading-5 text-[#91aba0]">{point.description}</p>
                  </div>
                  <span className="hidden text-right font-mono text-xs font-semibold text-[#b8e5c4] sm:block">
                    {point.value}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#e2efe5]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-20 sm:px-8 lg:flex-row lg:items-center lg:px-10 lg:py-24">
          <div>
            <Reveal>
              <p className="section-kicker">Ready when you are</p>
            </Reveal>
            <Reveal delay={0.06} className="mt-4">
              <h2 className="max-w-2xl text-4xl leading-[0.98] tracking-[-0.055em] text-[#17352d] sm:text-5xl">
                Make space for the work that matters.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.12}>
            <Button
              asChild
              size="lg"
              className="button-lift h-12 bg-[#17352d] px-5 text-[#f7f5ef] hover:bg-[#2c5748]"
            >
              <Link href="/register">
                Start with Invocore{" "}
                <ArrowUpRight
                  className="transition-transform duration-300 group-hover/button:translate-x-0.5 group-hover/button:-translate-y-0.5"
                  aria-hidden="true"
                />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      <footer className="bg-[#f7f5ef]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-xs text-[#789087] sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <p>© 2026 Invocore. A calmer way to get paid.</p>
          <div className="flex gap-5">
            <Link href="/login" className="transition-colors hover:text-[#17352d]">
              Log in
            </Link>
            <Link href="/register" className="transition-colors hover:text-[#17352d]">
              Create workspace
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
