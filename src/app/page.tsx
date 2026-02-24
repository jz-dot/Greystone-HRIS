import {
  Leaf,
  Users,
  CalendarDays,
  DollarSign,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  Zap,
  Globe,
  Clock,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

/* ============================================================
   Greystone HRIS — Landing Page
   Design: Linear / Raycast / Resend–inspired
   ============================================================ */

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ── Background effects ────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 80% 10%, rgba(6,182,212,0.08) 0%, transparent 70%)",
        }}
      />

      {/* ── Header / Navigation ──────────────────────────── */}
      <Header />

      {/* ── Hero ─────────────────────────────────────────── */}
      <HeroSection />

      {/* ── Logos / Social proof ──────────────────────────── */}
      <LogoCloud />

      {/* ── Features ─────────────────────────────────────── */}
      <FeaturesSection />

      {/* ── Stats ────────────────────────────────────────── */}
      <StatsSection />

      {/* ── Product preview ──────────────────────────────── */}
      <ProductPreview />

      {/* ── Testimonial ──────────────────────────────────── */}
      <TestimonialSection />

      {/* ── CTA ──────────────────────────────────────────── */}
      <CTASection />

      {/* ── Footer ───────────────────────────────────────── */}
      <Footer />
    </div>
  );
}

/* ============================================================
   Header
   ============================================================ */
function Header() {
  return (
    <header
      className="glass fixed top-0 right-0 left-0 z-50"
      style={{ height: "var(--header-height)" }}
    >
      <div
        className="mx-auto flex h-full items-center justify-between px-6"
        style={{ maxWidth: "var(--max-width)" }}
      >
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "var(--gradient-accent)" }}
          >
            <Leaf className="h-4 w-4 text-white" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Greystone
          </span>
        </a>

        {/* Nav links */}
        <nav className="hidden items-center gap-8 md:flex">
          {["Features", "Pricing", "About", "Docs"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-[13px] font-medium transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text-primary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-tertiary)")
              }
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <a href="#" className="btn btn-ghost hidden sm:inline-flex" style={{ fontSize: 13, padding: "8px 16px" }}>
            Sign in
          </a>
          <a href="#" className="btn btn-primary" style={{ fontSize: 13, padding: "8px 16px" }}>
            Get started
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   Hero Section
   ============================================================ */
function HeroSection() {
  return (
    <section className="relative flex flex-col items-center px-6 pt-40 pb-20 text-center">
      {/* Floating orb */}
      <div
        aria-hidden
        className="absolute top-20 left-1/2 h-[500px] w-[600px] -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
        style={{
          background: "var(--gradient-accent)",
          animation: "float 20s ease-in-out infinite",
        }}
      />

      {/* Badge */}
      <div
        className="animate-fade-in-up glass mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 opacity-0"
        style={{ animationDelay: "100ms" }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: "var(--accent)" }}
        />
        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          Now in public beta
        </span>
      </div>

      {/* Headline */}
      <h1
        className="animate-fade-in-up mx-auto max-w-3xl text-5xl leading-[1.1] font-bold tracking-tight opacity-0 md:text-7xl"
        style={{ animationDelay: "200ms", color: "var(--text-primary)" }}
      >
        People management,{" "}
        <span className="gradient-text">simplified</span>
      </h1>

      {/* Subheadline */}
      <p
        className="animate-fade-in-up mx-auto mt-6 max-w-lg text-base leading-relaxed opacity-0 md:text-lg"
        style={{ animationDelay: "350ms", color: "var(--text-secondary)" }}
      >
        Greystone HRIS brings leave tracking, payroll, and employee records
        into one fast, beautiful platform — so you can focus on your people,
        not paperwork.
      </p>

      {/* CTAs */}
      <div
        className="animate-fade-in-up mt-10 flex flex-col items-center gap-4 opacity-0 sm:flex-row"
        style={{ animationDelay: "500ms" }}
      >
        <a href="#" className="btn btn-accent btn-lg glow">
          Start free trial
          <ArrowRight className="h-4 w-4" />
        </a>
        <a href="#" className="btn btn-ghost btn-lg">
          See a demo
        </a>
      </div>

      {/* Subtle hint */}
      <p
        className="animate-fade-in mt-6 text-xs opacity-0"
        style={{ animationDelay: "650ms", color: "var(--text-muted)" }}
      >
        No credit card required &middot; Free for teams up to 10
      </p>
    </section>
  );
}

/* ============================================================
   Logo Cloud — Social proof strip
   ============================================================ */
function LogoCloud() {
  const companies = [
    "Vercel",
    "Stripe",
    "Notion",
    "Linear",
    "Figma",
    "Loom",
  ];

  return (
    <section className="px-6 py-16">
      <div className="mx-auto" style={{ maxWidth: "var(--max-width)" }}>
        <div className="divider mb-12" />
        <p
          className="mb-8 text-center text-xs font-medium uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          Trusted by teams at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {companies.map((name) => (
            <span
              key={name}
              className="text-sm font-semibold tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              {name}
            </span>
          ))}
        </div>
        <div className="divider mt-12" />
      </div>
    </section>
  );
}

/* ============================================================
   Features Section
   ============================================================ */
const features = [
  {
    icon: CalendarDays,
    title: "Leave management",
    description:
      "Submit, approve, and track time-off requests with an intuitive calendar view. Real-time balance updates, policy enforcement, and team visibility.",
  },
  {
    icon: DollarSign,
    title: "Payroll",
    description:
      "Run payroll in minutes with automated calculations, tax deductions, and direct deposit — with full audit trails and T4 generation.",
  },
  {
    icon: Users,
    title: "Employee directory",
    description:
      "A single source of truth for your team. Profiles, org charts, reporting lines, and custom fields — all searchable and filterable.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance",
    description:
      "Stay compliant with built-in policy templates, automated reminders, and document management for employment standards.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "Real-time dashboards for headcount, turnover, leave patterns, and payroll costs. Export reports or schedule automated delivery.",
  },
  {
    icon: Zap,
    title: "Automations",
    description:
      "Eliminate repetitive HR tasks. Onboarding workflows, approval chains, and notification rules that run themselves.",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto" style={{ maxWidth: "var(--max-width)" }}>
        {/* Section header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            Features
          </p>
          <h2
            className="text-3xl font-bold tracking-tight md:text-4xl"
            style={{ color: "var(--text-primary)" }}
          >
            Everything your HR team needs
          </h2>
          <p
            className="mt-4 text-base leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            A complete toolkit designed to reduce admin burden, keep your
            team informed, and make compliance effortless.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card card-accent group">
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
                style={{
                  background: "var(--accent-muted)",
                  color: "var(--accent)",
                }}
              >
                <f.icon className="h-5 w-5" />
              </div>
              <h3
                className="mb-2 text-[15px] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {f.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-tertiary)" }}
              >
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Stats Section
   ============================================================ */
const stats = [
  { value: "99.9%", label: "Uptime SLA" },
  { value: "2 min", label: "Avg. payroll run" },
  { value: "4.9/5", label: "Customer rating" },
  { value: "50k+", label: "Employees managed" },
];

function StatsSection() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto" style={{ maxWidth: "var(--max-width)" }}>
        <div
          className="glass grid gap-8 rounded-2xl p-10 sm:grid-cols-2 lg:grid-cols-4"
          style={{
            background: "var(--gradient-accent-subtle)",
            borderColor: "var(--border-accent)",
          }}
        >
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p
                className="text-3xl font-bold tracking-tight md:text-4xl"
                style={{ color: "var(--text-primary)" }}
              >
                {s.value}
              </p>
              <p
                className="mt-1 text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Product Preview — Mock dashboard
   ============================================================ */
function ProductPreview() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto" style={{ maxWidth: "var(--max-width)" }}>
        {/* Section header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            Product
          </p>
          <h2
            className="text-3xl font-bold tracking-tight md:text-4xl"
            style={{ color: "var(--text-primary)" }}
          >
            Designed for clarity
          </h2>
          <p
            className="mt-4 text-base leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            A dashboard that surfaces what matters. No clutter, no
            learning curve — just the information your team needs at a glance.
          </p>
        </div>

        {/* Mock dashboard */}
        <div
          className="overflow-hidden rounded-2xl border"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg-secondary)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {/* Window chrome */}
          <div
            className="flex items-center gap-2 border-b px-4 py-3"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            <span
              className="ml-4 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              dashboard — Greystone HRIS
            </span>
          </div>

          {/* Dashboard content */}
          <div className="grid gap-4 p-6 md:grid-cols-3">
            {/* Stat cards */}
            <DashCard label="Total employees" value="142" change="+3 this month" />
            <DashCard label="On leave today" value="7" change="4 vacation, 3 sick" />
            <DashCard label="Pending approvals" value="12" change="5 urgent" accent />

            {/* Activity feed */}
            <div
              className="rounded-xl border p-5 md:col-span-2"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-tertiary)",
              }}
            >
              <p
                className="mb-4 text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                Recent activity
              </p>
              <div className="space-y-3">
                {[
                  {
                    name: "Sarah Chen",
                    action: "submitted a vacation request",
                    time: "2m ago",
                  },
                  {
                    name: "Marcus Johnson",
                    action: "was approved for parental leave",
                    time: "15m ago",
                  },
                  {
                    name: "Elena Rodriguez",
                    action: "updated banking information",
                    time: "1h ago",
                  },
                  {
                    name: "David Kim",
                    action: "completed onboarding checklist",
                    time: "3h ago",
                  },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between border-b py-2 last:border-0"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold"
                        style={{
                          background: "var(--accent-muted)",
                          color: "var(--accent)",
                        }}
                      >
                        {item.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")}
                      </div>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                          {item.name}
                        </span>{" "}
                        {item.action}
                      </p>
                    </div>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div
              className="rounded-xl border p-5"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-tertiary)",
              }}
            >
              <p
                className="mb-4 text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                Quick actions
              </p>
              <div className="space-y-2">
                {[
                  "Run payroll",
                  "Approve requests",
                  "Add employee",
                  "Generate report",
                ].map((action) => (
                  <button
                    key={action}
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors"
                    style={{
                      color: "var(--text-secondary)",
                      background: "var(--bg-surface)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--bg-surface-hover)";
                      e.currentTarget.style.color = "var(--text-primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--bg-surface)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                  >
                    {action}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashCard({
  label,
  value,
  change,
  accent,
}: {
  label: string;
  value: string;
  change: string;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{
        borderColor: accent ? "var(--border-accent)" : "var(--border)",
        background: accent
          ? "var(--gradient-accent-subtle)"
          : "var(--bg-tertiary)",
      }}
    >
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p
        className="mt-1 text-2xl font-bold tracking-tight"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </p>
      <p className="mt-1 text-xs" style={{ color: accent ? "var(--accent)" : "var(--text-tertiary)" }}>
        {change}
      </p>
    </div>
  );
}

/* ============================================================
   Testimonial Section
   ============================================================ */
function TestimonialSection() {
  return (
    <section className="px-6 py-24">
      <div
        className="mx-auto max-w-3xl text-center"
        style={{ maxWidth: 720 }}
      >
        <div className="divider mb-16" />
        <blockquote>
          <p
            className="text-xl leading-relaxed font-medium md:text-2xl"
            style={{ color: "var(--text-primary)" }}
          >
            &ldquo;Greystone replaced three separate tools for us. The payroll
            runs that used to take half a day now take minutes. Our team
            actually enjoys using it — which is something I never thought
            I&rsquo;d say about HR software.&rdquo;
          </p>
          <footer className="mt-8">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Jamie Park
            </p>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              VP of People, Acme Corp
            </p>
          </footer>
        </blockquote>
        <div className="divider mt-16" />
      </div>
    </section>
  );
}

/* ============================================================
   CTA Section
   ============================================================ */
function CTASection() {
  return (
    <section className="relative overflow-hidden px-6 py-32">
      {/* Glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-radial-glow)" }}
      />

      <div className="mx-auto max-w-2xl text-center">
        <h2
          className="text-3xl font-bold tracking-tight md:text-5xl"
          style={{ color: "var(--text-primary)" }}
        >
          Ready to grow with{" "}
          <span className="gradient-text">Greystone</span>?
        </h2>
        <p
          className="mt-5 text-base leading-relaxed md:text-lg"
          style={{ color: "var(--text-secondary)" }}
        >
          Join thousands of teams who&rsquo;ve modernized their HR stack.
          Set up in under five minutes.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href="#" className="btn btn-accent btn-lg glow">
            Start free trial
            <ArrowRight className="h-4 w-4" />
          </a>
          <a href="#" className="btn btn-ghost btn-lg">
            Talk to sales
          </a>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
          {["Free 14-day trial", "No credit card", "Cancel anytime"].map(
            (item) => (
              <span
                key={item}
                className="flex items-center gap-1.5 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                {item}
              </span>
            )
          )}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Footer
   ============================================================ */
function Footer() {
  const columns = [
    {
      title: "Product",
      links: ["Features", "Pricing", "Changelog", "Integrations"],
    },
    {
      title: "Company",
      links: ["About", "Blog", "Careers", "Press"],
    },
    {
      title: "Resources",
      links: ["Documentation", "API", "Guides", "Community"],
    },
    {
      title: "Legal",
      links: ["Privacy", "Terms", "Security", "DPA"],
    },
  ];

  return (
    <footer className="px-6 pb-12 pt-16">
      <div className="mx-auto" style={{ maxWidth: "var(--max-width)" }}>
        <div className="divider mb-12" />
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <a href="/" className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "var(--gradient-accent)" }}
              >
                <Leaf className="h-4 w-4 text-white" />
              </div>
              <span className="text-[15px] font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Greystone
              </span>
            </a>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Modern people management for modern teams.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <p
                className="mb-4 text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                {col.title}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm transition-colors"
                      style={{ color: "var(--text-tertiary)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "var(--text-primary)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "var(--text-tertiary)")
                      }
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="divider mt-12 mb-6" />
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            &copy; {new Date().getFullYear()} Greystone Strategic Partners Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {[Globe, Clock].map((Icon, i) => (
              <Icon
                key={i}
                className="h-4 w-4 transition-colors"
                style={{ color: "var(--text-muted)" }}
              />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
