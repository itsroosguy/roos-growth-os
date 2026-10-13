"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Sparkles,
  Clock,
  ShieldCheck,
  Layers,
  Globe,
  Building2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Linkedin,
  Send,
  MessageSquare,
  Calendar,
  Zap,
  BarChart3,
  Users,
  Code2,
  Palette,
  Compass,
  Cpu,
  TrendingUp,
  X,
  Smartphone,
  CheckSquare,
} from "lucide-react";

// ============================================================================
// DATA STRUCTURES (AUTHENTIC ROOS STUDIOX ASSETS & SPECIFICATIONS)
// ============================================================================

interface ServiceItem {
  id: string;
  num: string;
  category: "strategy" | "design" | "engineering" | "growth";
  title: string;
  tagline: string;
  description: string;
  deliverables: string[];
  businessImpact: string[];
}

const SERVICES: ServiceItem[] = [
  {
    id: "brand-trust",
    num: "01",
    category: "strategy",
    title: "Build a Brand People Trust",
    tagline: "Make a Strong First Impression That Lasts",
    description:
      "Your brand is the first interaction potential buyers have with your company. If it fails to inspire trust, deals are lost before conversations start. We craft authoritative, memorable visual identity systems that position you as the definitive leader.",
    deliverables: [
      "Brand Positioning Strategy",
      "Signature Logo & Wordmark",
      "Design Guidelines & Style Kit",
      "Executive Deck & Marketing Assets",
    ],
    businessImpact: [
      "Instant market credibility",
      "Premium price justification",
      "Higher buyer trust",
    ],
  },
  {
    id: "position-win",
    num: "02",
    category: "strategy",
    title: "Define What Makes You Different",
    tagline: "Position Your Business To Win",
    description:
      "Most businesses underperform because prospects cannot grasp why they should choose them over competitors. We uncover your unique commercial moat, clarify your value proposition, and engineer messaging that attracts high-intent clients.",
    deliverables: [
      "Competitive Moat Analysis",
      "Core Value Proposition Framework",
      "Conversion Messaging Playbook",
      "Customer Decision Journey Mapping",
    ],
    businessImpact: [
      "Sharper sales conversations",
      "Shortened sales cycles",
      "Clear market distinction",
    ],
  },
  {
    id: "turn-customers",
    num: "03",
    category: "design",
    title: "Turn Visitors Into Customers",
    tagline: "Create Experiences That Drive Action",
    description:
      "A pretty website is worthless if it doesn't convert. We architect intuitive, human-centered UI/UX systems and friction-free user journeys engineered to guide decision-makers directly toward booking, enquiry, and purchase.",
    deliverables: [
      "High-Conversion Website Design",
      "Design Systems & Component Kits",
      "Interactive High-Fidelity Prototypes",
      "Conversion Rate Optimization (CRO)",
    ],
    businessImpact: [
      "Higher visitor-to-lead ratio",
      "Frictionless user engagement",
      "Measurable enquiry volume lift",
    ],
  },
  {
    id: "platforms-scale",
    num: "04",
    category: "engineering",
    title: "Build Digital Platforms That Scale",
    tagline: "High-Performance Modern Web Engineering",
    description:
      "Slow, bloated websites kill conversions and damage search rankings. We build ultra-clean, custom web platforms and portals powered by Next.js and edge infrastructure—guaranteeing sub-second load times and 99+ Lighthouse performance.",
    deliverables: [
      "Bespoke Next.js & React Engineering",
      "Client Portals & SaaS Dashboards",
      "Zero-Latency Edge CDN Deployment",
      "API & CRM Webhook Architecture",
    ],
    businessImpact: [
      "Sub-second page speeds",
      "Superior Google SEO rankings",
      "Rock-solid infrastructure scalability",
    ],
  },
  {
    id: "scale-smarter",
    num: "05",
    category: "growth",
    title: "Save Time. Scale Smarter.",
    tagline: "Automate Repetitive Work And Focus On Revenue",
    description:
      "As deal flow accelerates, manual bottlenecks cost money. We build end-to-end automation workflows, connecting WhatsApp Business, CRM routing, instant notifications, and follow-ups so no lead ever slips through the cracks.",
    deliverables: [
      "WhatsApp Business API Workflows",
      "Multi-Channel CRM Routing",
      "Instant Lead Response Automations",
      "Internal Operations Integration",
    ],
    businessImpact: [
      "Instant response times (< 60s)",
      "Zero lost leads or missed follow-ups",
      "Reduced manual operational overhead",
    ],
  },
  {
    id: "generate-leads",
    num: "06",
    category: "growth",
    title: "Generate More Leads & Opportunities",
    tagline: "Create A Predictable Growth Engine",
    description:
      "Even category-leading products need systematic demand generation. We architect targeted performance marketing funnels, search authority strategies, and conversion tracking suites that deliver predictable inbound revenue.",
    deliverables: [
      "High-Intent Paid Acquisition Funnels",
      "Organic Search & Keyword Strategy",
      "Full-Funnel Conversion Tracking",
      "Ad Creative & Landing Page Sprints",
    ],
    businessImpact: [
      "Predictable pipeline velocity",
      "Decreased customer acquisition cost",
      "Compounding business revenue",
    ],
  },
];

interface CaseStudy {
  id: string;
  title: string;
  client: string;
  location: string;
  category: string;
  year: string;
  description: string;
  metrics: { label: string; value: string }[];
  tags: string[];
  imageUrl: string;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: "aetheria-os",
    title: "Aetheria Spatial OS",
    client: "Aetheria Vision Inc.",
    location: "Dubai, UAE",
    category: "Spatial UI & WebGL Motion",
    year: "2026",
    description:
      "Engineered an immersive real-time WebGL interface system bridging 3D visualization and responsive enterprise controls with sub-16ms render latency.",
    metrics: [
      { label: "Engagement Lift", value: "+140%" },
      { label: "Render Latency", value: "< 16ms" },
      { label: "Pipeline Impact", value: "3.8x" },
    ],
    tags: ["Three.js", "WebGL Shaders", "Spatial Design", "Framer Motion"],
    imageUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "hyperion-ai",
    title: "Hyperion AI Core",
    client: "Hyperion Intelligence",
    location: "Toronto, Canada",
    category: "Brand Architecture & Identity",
    year: "2026",
    description:
      "Complete visual identity, dynamic generative logo, and design tokens for an enterprise autonomous intelligence platform operating across global markets.",
    metrics: [
      { label: "Category Rank", value: "#1 Leader" },
      { label: "Conversion Lift", value: "+65%" },
      { label: "Valuation Scale", value: "4.2x" },
    ],
    tags: ["Generative Identity", "Brand Strategy", "Typography", "Design System"],
    imageUrl:
      "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "chronos-vault",
    title: "Chronos Digital Vault",
    client: "Chronos Group APAC",
    location: "Singapore & Hong Kong",
    category: "Fintech Platform & Dark UX",
    year: "2026",
    description:
      "High-security financial liquidity manager with dark luxury UX, real-time capital visualization, and millisecond financial chart updates.",
    metrics: [
      { label: "Capital Managed", value: "$450M+" },
      { label: "User Retention", value: "+48%" },
      { label: "Lighthouse Score", value: "99/100" },
    ],
    tags: ["React & Next.js", "Dark Luxury UX", "High-Freq Charts", "Tailwind CSS"],
    imageUrl:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "lumina-cinema",
    title: "Lumina Generative Film",
    client: "Lumina Studios Tokyo",
    location: "Tokyo, Japan",
    category: "Motion Identity & Web Experience",
    year: "2025",
    description:
      "Autonomous motion identity and interactive digital showcase featuring sound-reactive typography and ambient WebGL particle displays.",
    metrics: [
      { label: "Audience Growth", value: "+210%" },
      { label: "Global Reach", value: "34 Countries" },
      { label: "Industry Recognition", value: "Award Winner" },
    ],
    tags: ["Kinetic Typography", "Video Shaders", "Interactive Sound", "WebGL"],
    imageUrl:
      "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?q=80&w=1200&auto=format&fit=crop",
  },
];

interface ProcessStep {
  id: string;
  num: string;
  title: string;
  headline: string;
  tagline: string;
  description: string;
  deliverables: string[];
}

const PROCESS_STEPS: ProcessStep[] = [
  {
    id: "discover",
    num: "01",
    title: "Discover",
    headline: "Research & Commercial Bottleneck Audit",
    tagline: "Uncover hidden opportunities and eliminate buyer friction.",
    description:
      "We dissect your existing brand touchpoints, competitive landscape, and customer decision triggers to locate where revenue is leaking.",
    deliverables: [
      "30-minute bottleneck discovery audit",
      "Customer friction & churn roadmap",
      "Prioritized revenue action plan",
    ],
  },
  {
    id: "define",
    num: "02",
    title: "Define",
    headline: "Positioning Blueprint & Copy Strategy",
    tagline: "Create undeniable market authority within 3 seconds.",
    description:
      "We engineer concise value propositions, clear headlines, and distinct brand positioning that immediately separate you from competitors.",
    deliverables: [
      "High-intent value proposition blueprint",
      "Distinct brand voice & copywriting rules",
      "Frictionless customer conversion flow",
    ],
  },
  {
    id: "design",
    num: "03",
    title: "Design",
    headline: "Meticulous UI/UX & Digital Systems",
    tagline: "Design experiences that turn curiosity into commitment.",
    description:
      "Bespoke visual design tokens, responsive typography, and interactive prototypes built with obsessive attention to craft and conversion.",
    deliverables: [
      "Bespoke modern UI/UX design systems",
      "Interactive Figma prototype & user testing",
      "Complete scalable design token architecture",
    ],
  },
  {
    id: "build",
    num: "04",
    title: "Build",
    headline: "High-Velocity Code Sprint",
    tagline: "Zero template bloat. Sub-second performance baseline.",
    description:
      "Production-grade Next.js codebase engineered in rapid sprints. Optimized for Google Core Web Vitals, mobile responsiveness, and clean architecture.",
    deliverables: [
      "Bespoke Next.js 99+ speed baseline",
      "Automated WhatsApp & CRM webhook pipelines",
      "Zero-latency edge CDN deployment",
    ],
  },
  {
    id: "accelerate",
    num: "05",
    title: "Accelerate",
    headline: "Rollout, Telemetry & Growth Tuning",
    tagline: "Continuous conversion optimization and compounding revenue.",
    description:
      "We monitor conversion telemetry, optimize user drop-off points, and scale automated follow-ups to ensure your digital ecosystem compounds.",
    deliverables: [
      "Zero-downtime production deployment",
      "Conversion analytics & lead telemetry suite",
      "Ongoing growth tuning & conversion review",
    ],
  },
];

interface ComparisonRow {
  dimension: string;
  traditional: {
    title: string;
    badge: string;
    desc: string;
  };
  roos: {
    title: string;
    badge: string;
    desc: string;
  };
}

const COMPARISONS: ComparisonRow[] = [
  {
    dimension: "STRATEGIC APPROACH",
    traditional: {
      title: "One-off Fragmented Services",
      badge: "NO OUTCOME GUARANTEE",
      desc: "Delivers standalone logos or disconnected ads without inspecting whether your brand actually converts visitors into paying customers.",
    },
    roos: {
      title: "End-to-End Growth Partner",
      badge: "FOCUS ON REAL ROI",
      desc: "We unite brand strategy, high-speed website design, targeted acquisition, and automated WhatsApp CRM into one seamless revenue engine.",
    },
  },
  {
    dimension: "TURNAROUND SPEED",
    traditional: {
      title: "Slow 3–6 Months Process",
      badge: "EXPENSIVE DELAYS",
      desc: "Unnecessary meetings, sluggish email chains, and months of delay before your website or campaign ever reaches customers.",
    },
    roos: {
      title: "Fast 4–6 Weeks Delivery",
      badge: "ON-TIME LAUNCH",
      desc: "Structured, high-velocity sprints with transparent weekly milestone reviews and strict on-time live deployments.",
    },
  },
  {
    dimension: "ENGINEERING QUALITY",
    traditional: {
      title: "Bloated Template Builders",
      badge: "4s+ SLOW LOAD SPEED",
      desc: "Generic WordPress or heavy drag-and-drop templates burdened with plugins that break, load slowly, and repel mobile buyers.",
    },
    roos: {
      title: "Custom Modern Next.js Architecture",
      badge: "SUB-SECOND SPEED",
      desc: "Clean, bespoke code engineered for modern smartphones and Google benchmarks, loading in under 1 second with 99+ performance.",
    },
  },
  {
    dimension: "LEAD AUTOMATION",
    traditional: {
      title: "Manual Lead Handling",
      badge: "LOST REVENUE",
      desc: "Inquiries languish in email inboxes for hours or days with zero automatic routing, no CRM logging, and no structured follow-up.",
    },
    roos: {
      title: "Instant WhatsApp & CRM Sync",
      badge: "< 60s INSTANT RESPONSE",
      desc: "Inquiries trigger automated WhatsApp confirmations, notify sales reps in real time, and synchronize directly into your pipeline.",
    },
  },
  {
    dimension: "PRICING TRANSPARENCY",
    traditional: {
      title: "Scope Creep & Vague Retainers",
      badge: "UNEXPECTED BILLS",
      desc: "Confusing billable hours, surprise change orders for small revisions, and inflated retainers with minimal tangible output.",
    },
    roos: {
      title: "100% Upfront Transparent Scope",
      badge: "CLEAR FIXED PRICING",
      desc: "Clear upfront project scope, well-defined deliverables, fixed investment, and guaranteed founder-direct accountability.",
    },
  },
];

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "How does Roos StudioX help my business grow?",
    answer:
      "We reject the fragmented agency model where you hire one person for design, another for ads, and another for development. We look at your business holistically—elevating your brand positioning, creating an ultra-fast lead-converting website, setting up automated WhatsApp and CRM follow-ups, and architecting acquisition campaigns that convert.",
  },
  {
    question: "What is the typical turnaround timeline for a project?",
    answer:
      "A complete branding and custom website project typically spans 4 to 6 weeks from initial kickoff to live launch. We run structured weekly sprints with clear milestone deliverables so you are never left guessing where the project stands.",
  },
  {
    question: "Can we engage Roos StudioX for a specific individual module?",
    answer:
      "Yes. While our comprehensive growth partnerships deliver compounding value, you can begin with a targeted sprint—such as a custom website redesign, brand identity architecture, or WhatsApp CRM & workflow automation—and expand as your revenue grows.",
  },
  {
    question: "What time commitment is required from our leadership team?",
    answer:
      "We design our engagements to respect your time. Your involvement is concentrated in the initial discovery audit, structured weekly milestone sign-offs, and final pre-launch review. We handle the heavy lifting of strategy, design, copy, and engineering.",
  },
];

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function RoosStudioXLandingPage() {
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "strategy" | "design" | "engineering" | "growth"
  >("all");
  const [activeStep, setActiveStep] = useState<string>("discover");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Modal Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    linkedin: "",
    scope: "Brand Strategy & Website Design",
    budget: "$5,000 – $15,000",
    notes: "",
  });

  const filteredServices =
    selectedCategory === "all"
      ? SERVICES
      : SERVICES.filter((s) => s.category === selectedCategory);

  const activeProcessObj =
    PROCESS_STEPS.find((p) => p.id === activeStep) || PROCESS_STEPS[0];

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setModalOpen(false);
      setSubmitted(false);
      setFormData({
        name: "",
        email: "",
        linkedin: "",
        scope: "Brand Strategy & Website Design",
        budget: "$5,000 – $15,000",
        notes: "",
      });
    }, 2800);
  };

  return (
    <div className="relative min-h-screen bg-[#050505] text-[#FAFAFA] font-sans selection:bg-[#FF7A1A] selection:text-white overflow-x-hidden">
      {/* ===================================================================== */}
      {/* ATMOSPHERIC BACKGROUND EFFECTS (AUTHENTIC ROOS STUDIOX EMBER GLOWS)   */}
      {/* ===================================================================== */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#FF7A1A08_1px,transparent_1px),linear-gradient(to_bottom,#FF7A1A08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_20%,#000_70%,transparent_100%)] opacity-70" />

        {/* Top Radial Ember Ambient Glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-[#FF7A1A]/18 via-[#FF7A1A]/4 to-transparent blur-[160px]" />

        {/* Mid-page secondary glow */}
        <div className="absolute top-[45%] right-0 w-[600px] h-[450px] bg-[#FF7A1A]/6 rounded-full blur-[180px]" />
      </div>

      {/* ===================================================================== */}
      {/* FLOATING FROSTED PILL NAVIGATION BAR                                  */}
      {/* ===================================================================== */}
      <header className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex h-16 items-center justify-between rounded-2xl border border-[#27272A]/90 bg-[#0A0A0C]/90 px-4 sm:px-6 shadow-2xl backdrop-blur-xl transition-all duration-300">
            {/* Official Roos StudioX Logo & Brandmark */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FF7A1A] to-[#FF8833] text-black font-extrabold shadow-md shadow-[#FF7A1A]/30 group-hover:scale-105 transition-transform">
                <span className="text-base font-extrabold tracking-tighter">RX</span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-white group-hover:text-[#FF7A1A] transition-colors flex items-center gap-1">
                  ROOS <span className="text-[#FF7A1A]">STUDIOX</span>
                  <span className="text-[10px] text-zinc-500 font-normal">®</span>
                </span>
                <span className="text-[9px] font-mono tracking-wider text-zinc-400 uppercase">
                  Growth Partner
                </span>
              </div>
            </Link>

            {/* Center Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-xs font-semibold text-zinc-300">
              <a
                href="#services"
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-[#18181B] transition-colors"
              >
                Services
              </a>
              <a
                href="#works"
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-[#18181B] transition-colors"
              >
                Selected Works
              </a>
              <a
                href="#process"
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-[#18181B] transition-colors"
              >
                The Momentum Engine
              </a>
              <a
                href="#approach"
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-[#18181B] transition-colors"
              >
                Why StudioX
              </a>
              <a
                href="#about"
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-[#18181B] transition-colors"
              >
                About
              </a>
              <a
                href="#faq"
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-[#18181B] transition-colors"
              >
                FAQ
              </a>
            </nav>

            {/* Right Action CTAs */}
            <div className="flex items-center space-x-3">
              <Link href="/app/acme-corp/overview" className="hidden sm:inline-flex">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-800 bg-[#121215] text-zinc-300 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
                >
                  Client Portal
                </button>
              </Link>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#FF7A1A] hover:bg-[#FF8833] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-[#FF7A1A]/30 flex items-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Book Strategy Call</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* HERO SECTION (COMMANDING EDITORIAL TYPOGRAPHY & VALUE PROPOSITION)    */}
      {/* ===================================================================== */}
      <section className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-4 sm:px-6 pt-36 pb-20 text-center">
        {/* Real-time Studio Availability Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#27272A] bg-[#0A0A0C]/90 px-4 py-1.5 text-xs font-mono font-medium text-zinc-300 shadow-xl mb-8 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="tracking-wide">
            STUDIO STATUS: ACCEPTING Q3/Q4 PROJECTS • BLR • DXB • TOR
          </span>
        </div>

        {/* Master Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] text-white max-w-5xl">
          We Help Ambitious Businesses <br className="hidden sm:block" />
          Build Strong Brands &amp; <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-[#FF7A1A] via-[#FF8833] to-amber-500 bg-clip-text text-transparent">
            Drive Real Growth
          </span>
        </h1>

        {/* Strategic Supporting Copy */}
        <p className="mt-6 text-base sm:text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed text-zinc-300">
          From brand strategy and high-converting digital platforms to growth
          systems and workflow automation, we engineer end-to-end ecosystems that
          scale sustainable business revenue.
        </p>

        {/* Primary Action Group */}
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#FF7A1A] hover:bg-[#FF8833] text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xl shadow-[#FF7A1A]/35 cursor-pointer flex items-center justify-center gap-2.5 group hover:scale-105 active:scale-95"
          >
            <span>Book A Free Strategy Call</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <a
            href="#works"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#121215] border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
          >
            <span>Explore Selected Works</span>
            <ArrowUpRight className="h-4 w-4 text-[#FF7A1A]" />
          </a>
        </div>

        {/* Trust Proof Pillars Bar */}
        <div className="mt-14 pt-8 border-t border-zinc-800/80 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs font-mono font-semibold tracking-wider text-zinc-300 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#FF7A1A]" />
            <span>CLEAR UPFRONT PRICING</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#FF7A1A]" />
            <span>FAST 4–6 WEEKS TURNAROUND</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#FF7A1A]" />
            <span>FOUNDER-DIRECT ENGAGEMENT</span>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SELECTED WORKS / PROVEN CASE STUDIES (#works)                         */}
      {/* ===================================================================== */}
      <section id="works" className="relative z-10 py-24 border-t border-zinc-900 bg-[#070709]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-[#FF7A1A] font-bold">
                PROVEN CASE STUDIES
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                Selected Client Work
              </h2>
              <p className="text-zinc-400 max-w-xl text-sm sm:text-base leading-relaxed">
                Real brands, authentic enterprise outcomes, and category-defining digital
                products built across international markets.
              </p>
            </div>
            <div className="text-xs font-mono text-zinc-400">
              [ 04 FEATURED PLATFORMS ]
            </div>
          </div>

          {/* Editorial Case Studies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {CASE_STUDIES.map((project) => (
              <div
                key={project.id}
                className="group relative rounded-3xl border border-zinc-800/90 bg-[#0A0A0C] overflow-hidden transition-all duration-300 hover:border-[#FF7A1A]/70 shadow-2xl flex flex-col"
              >
                {/* Visual Imagery Container */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={project.imageUrl}
                    alt={project.title}
                    className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105 filter contrast-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/30 to-transparent" />

                  {/* Top Meta Badges */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[11px] font-mono font-medium text-white">
                      {project.category}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#FF7A1A]/20 border border-[#FF7A1A]/40 text-[11px] font-mono font-bold text-[#FF7A1A]">
                      {project.year}
                    </span>
                  </div>
                </div>

                {/* Content & Commercial Impact */}
                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                      <span>{project.client}</span>
                      <span>{project.location}</span>
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight text-white group-hover:text-[#FF7A1A] transition-colors flex items-center justify-between">
                      <span>{project.title}</span>
                      <ArrowUpRight className="h-5 w-5 text-zinc-500 group-hover:text-[#FF7A1A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </h3>
                    <p className="text-sm text-zinc-400 leading-relaxed pt-1">
                      {project.description}
                    </p>
                  </div>

                  {/* Commercial Metrics Strip */}
                  <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#121215] border border-zinc-800">
                    {project.metrics.map((m, idx) => (
                      <div key={idx} className="text-center sm:text-left">
                        <span className="block text-lg sm:text-xl font-mono font-black text-white">
                          {m.value}
                        </span>
                        <span className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mt-0.5">
                          {m.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Technology Tags */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {project.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-[#18181B] text-[11px] font-mono text-zinc-400 border border-zinc-800/80"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* BENTO CORE SERVICES (#services)                                       */}
      {/* ===================================================================== */}
      <section id="services" className="relative z-10 py-24 border-t border-zinc-900 bg-[#050505]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
          {/* Header & Filter Tabs */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800 pb-8">
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-[#FF7A1A] font-bold">
                END-TO-END CAPABILITIES
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                Our Core Services
              </h2>
              <p className="text-zinc-400 max-w-xl text-sm sm:text-base leading-relaxed">
                Strategic consulting, bespoke visual design, high-velocity engineering, and
                revenue automation tailored for high-growth enterprises.
              </p>
            </div>

            {/* Filter Pill Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "all", label: "All Services" },
                { id: "strategy", label: "Strategy" },
                { id: "design", label: "Design" },
                { id: "engineering", label: "Engineering" },
                { id: "growth", label: "Growth" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === tab.id
                      ? "bg-[#FF7A1A] text-white shadow-lg shadow-[#FF7A1A]/30 scale-105"
                      : "bg-[#121215] border border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Services Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="group relative p-8 sm:p-10 rounded-3xl border border-zinc-800/90 bg-[#0A0A0C] transition-all duration-300 hover:border-[#FF7A1A]/70 space-y-6 shadow-xl flex flex-col justify-between"
              >
                {/* Glow accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FF7A1A] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#FF7A1A] uppercase tracking-wider px-3 py-1 rounded-full bg-[#FF7A1A]/10 border border-[#FF7A1A]/20">
                      SERVICE {service.num}
                    </span>
                    <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                      {service.category}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold tracking-tight text-white group-hover:text-[#FF7A1A] transition-colors">
                    {service.title}
                  </h3>

                  <p className="text-xs font-mono text-zinc-400 tracking-wide uppercase">
                    &bull; {service.tagline}
                  </p>

                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Deliverables List */}
                <div className="space-y-4 pt-4 border-t border-zinc-800/80">
                  <span className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                    KEY DELIVERABLES:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {service.deliverables.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs text-zinc-300"
                      >
                        <Check className="h-3.5 w-3.5 text-[#FF7A1A] shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Commercial Impact Strip */}
                  <div className="pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {service.businessImpact.map((impact, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-[#141418] border border-zinc-800 text-[11px] font-mono text-emerald-400"
                        >
                          + {impact}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* THE MOMENTUM ENGINE (5-STAGE SPRINT METHODOLOGY) (#process)           */}
      {/* ===================================================================== */}
      <section id="process" className="relative z-10 py-24 border-t border-zinc-900 bg-[#08080A]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-16">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono uppercase tracking-widest text-[#FF7A1A] font-bold">
              THE SPRINT METHODOLOGY
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              The Momentum Engine
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              A structured 5-stage framework engineered to take your company from brand
              bottlenecks to category leadership in 4 to 6 weeks.
            </p>
          </div>

          {/* Interactive Steps Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-4xl mx-auto">
            {PROCESS_STEPS.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  activeStep === step.id
                    ? "bg-[#141418] border-[#FF7A1A] shadow-lg shadow-[#FF7A1A]/20 scale-102"
                    : "bg-[#0A0A0C] border-zinc-800 hover:border-zinc-700 opacity-80 hover:opacity-100"
                }`}
              >
                <span
                  className={`block text-xs font-mono font-bold ${
                    activeStep === step.id ? "text-[#FF7A1A]" : "text-zinc-500"
                  }`}
                >
                  PHASE {step.num}
                </span>
                <span className="block text-sm font-bold text-white mt-1">
                  {step.title}
                </span>
              </button>
            ))}
          </div>

          {/* Active Step Deep-Dive Card */}
          <div className="p-8 sm:p-12 rounded-3xl border border-zinc-800 bg-[#0A0A0C] max-w-4xl mx-auto space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF7A1A]/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
              <div>
                <span className="text-xs font-mono text-[#FF7A1A] font-bold uppercase tracking-wider">
                  PHASE {activeProcessObj.num} &bull; {activeProcessObj.title}
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                  {activeProcessObj.headline}
                </h3>
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-[#141418] border border-zinc-700 text-xs font-mono text-zinc-300 self-start sm:self-auto">
                {activeProcessObj.tagline}
              </span>
            </div>

            <p className="text-base text-zinc-300 leading-relaxed">
              {activeProcessObj.description}
            </p>

            <div className="space-y-4 pt-4">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold block">
                PHASE DELIVERABLES:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {activeProcessObj.deliverables.map((d, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#121215] border border-zinc-800 text-xs font-medium text-zinc-200 flex items-start gap-2.5"
                  >
                    <Check className="h-4 w-4 text-[#FF7A1A] shrink-0 mt-0.5" />
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* WHY ROOS STUDIOX VS TRADITIONAL AGENCIES (#approach)                  */}
      {/* ===================================================================== */}
      <section id="approach" className="relative z-10 py-24 border-t border-zinc-900 bg-[#050505]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono uppercase tracking-widest text-[#FF7A1A] font-bold">
              THE COMMERCIAL SHIFT
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Why Ambitious Brands Choose StudioX
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              Traditional agencies are built on billable hours, slow handoffs, and disjointed
              deliverables. We operate as an aligned growth partner built for velocity and ROI.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="space-y-4 max-w-5xl mx-auto">
            {COMPARISONS.map((comp, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 rounded-2xl border border-zinc-800/90 bg-[#0A0A0C] overflow-hidden"
              >
                {/* Feature Label */}
                <div className="md:col-span-3 p-5 sm:p-6 bg-[#0E0E12] border-b md:border-b-0 md:border-r border-zinc-800 flex items-center">
                  <span className="text-xs font-mono font-bold tracking-wider text-zinc-300 uppercase">
                    {comp.dimension}
                  </span>
                </div>

                {/* Traditional Agency Cell */}
                <div className="md:col-span-4 p-5 sm:p-6 bg-[#09090C] border-b md:border-b-0 md:border-r border-zinc-800/80 space-y-2 opacity-75">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-zinc-500 line-through">
                      Traditional Agency
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 font-bold">
                      {comp.traditional.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-zinc-400">
                    {comp.traditional.title}
                  </h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {comp.traditional.desc}
                  </p>
                </div>

                {/* Roos StudioX Advantage Cell */}
                <div className="md:col-span-5 p-5 sm:p-6 bg-[#121216] space-y-2 border-l-2 border-[#FF7A1A]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#FF7A1A] font-bold">
                      Roos StudioX Partner
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF7A1A]/20 text-[#FF7A1A] font-bold">
                      {comp.roos.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-[#FF7A1A]" />
                    {comp.roos.title}
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {comp.roos.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* THE CLIENT OPERATING SYSTEM (WHATSAPP CRM & AUTOMATION PLATFORM)     */}
      {/* ===================================================================== */}
      <section className="relative z-10 py-24 border-t border-zinc-900 bg-[#070709]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-[#FF7A1A] font-bold">
                PROPRIETARY CLIENT INFRASTRUCTURE
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                Client Growth Operating System
              </h2>
              <p className="text-zinc-400 max-w-xl text-sm sm:text-base leading-relaxed">
                Beyond agency strategy, our partners receive access to our unified CRM and
                automation platform—managing multi-agent WhatsApp messaging, deal pipelines, and
                lead follow-ups in one workspace.
              </p>
            </div>

            <Link href="/app/acme-corp/overview">
              <button
                type="button"
                className="px-6 py-3 rounded-xl bg-[#121215] border border-zinc-800 text-white text-xs font-bold uppercase tracking-wider hover:border-[#FF7A1A] transition-all flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105"
              >
                <span>Launch Live Workspace</span>
                <ArrowRight className="h-4 w-4 text-[#FF7A1A]" />
              </button>
            </Link>
          </div>

          {/* Platform Capability Bento Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Shared WhatsApp Inbox */}
            <div className="p-8 rounded-3xl border border-zinc-800 bg-[#0A0A0C] space-y-4 hover:border-zinc-700 transition-all">
              <div className="h-12 w-12 rounded-2xl bg-[#FF7A1A]/10 border border-[#FF7A1A]/20 flex items-center justify-center text-[#FF7A1A]">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Shared WhatsApp Inbox</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Empower multiple team members to manage customer conversations from a single
                verified WhatsApp Business number with role permissions and ticket tagging.
              </p>
              <div className="pt-2 text-xs font-mono text-[#FF7A1A] flex items-center gap-1">
                <span>Official Meta Cloud API</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>

            {/* Card 2: CRM & Lead Stages */}
            <div className="p-8 rounded-3xl border border-zinc-800 bg-[#0A0A0C] space-y-4 hover:border-zinc-700 transition-all">
              <div className="h-12 w-12 rounded-2xl bg-[#FF7A1A]/10 border border-[#FF7A1A]/20 flex items-center justify-center text-[#FF7A1A]">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Visual Lead Pipeline</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Track deals across 6 strategic stages: New, Contacted, Qualified, Proposal, Won,
                and Lost with estimated values, probability scoring, and team assignment.
              </p>
              <div className="pt-2 text-xs font-mono text-[#FF7A1A] flex items-center gap-1">
                <span>Integrated Contact Store</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>

            {/* Card 3: Automated Journeys */}
            <div className="p-8 rounded-3xl border border-zinc-800 bg-[#0A0A0C] space-y-4 hover:border-zinc-700 transition-all">
              <div className="h-12 w-12 rounded-2xl bg-[#FF7A1A]/10 border border-[#FF7A1A]/20 flex items-center justify-center text-[#FF7A1A]">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Workflow Automations</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Trigger instant welcome messages, auto-create follow-up tasks upon qualification,
                and broadcast pre-approved Meta message templates with loop protection.
              </p>
              <div className="pt-2 text-xs font-mono text-[#FF7A1A] flex items-center gap-1">
                <span>Sub-Second Event Triggers</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* ABOUT STUDIOX & FOUNDER JOURNEY (#about)                              */}
      {/* ===================================================================== */}
      <section id="about" className="relative z-10 py-24 border-t border-zinc-900 bg-[#050505]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Founder Visual Frame */}
            <div className="lg:col-span-5 relative group">
              <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-[#0E0E12] shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop"
                  alt="Praveen Raj — Founder & Managing Director, Roos StudioX"
                  className="w-full h-auto max-h-[460px] object-cover object-center filter grayscale contrast-[1.1] group-hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                {/* Founder ID Card Badge */}
                <div className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl bg-[#0A0A0C]/90 backdrop-blur-md border border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-base text-white flex items-center gap-1.5">
                      Praveen Raj
                    </h4>
                    <p className="text-[10px] font-mono text-[#FF7A1A] uppercase tracking-wider font-semibold">
                      Founder &amp; Managing Director
                    </p>
                  </div>
                  <a
                    href="https://www.linkedin.com/in/itsroosguy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-full bg-[#0077B5] hover:bg-[#005E93] text-white transition-all shadow-md shrink-0"
                    aria-label="LinkedIn profile"
                  >
                    <Linkedin className="h-4 w-4 fill-current" />
                  </a>
                </div>
              </div>

              {/* Ambient Glow behind frame */}
              <div className="absolute -inset-3 bg-gradient-to-tr from-[#FF7A1A]/20 to-transparent rounded-[36px] blur-2xl -z-10 group-hover:from-[#FF7A1A]/35 transition-all duration-500" />
            </div>

            {/* Founder Story & Manifesto */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase tracking-widest text-[#FF7A1A] font-bold">
                  ABOUT STUDIOX
                </span>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                  Building Growth Engines That Stand The Test of Scale
                </h2>
              </div>

              <div className="space-y-4 text-sm sm:text-base font-normal leading-relaxed text-zinc-300">
                <p className="border-l-2 border-[#FF7A1A] pl-4 italic text-zinc-200">
                  &ldquo;I founded Roos StudioX with a singular mission: to bridge the gap
                  between high-end brand aesthetics and measurable business revenue.&rdquo;
                </p>
                <p>
                  Over 7+ years of strategic consulting across international markets in the UAE,
                  Canada, APAC, and India, I witnessed brilliant founders struggle with fragmented
                  agencies, bloated budgets, and zero commercial accountability.
                </p>
                <p>
                  We combine strategy, design, technology, and AI automation into high-performance
                  digital ecosystems that strengthen brand equity, improve user conversion, and
                  drive sustainable revenue growth.
                </p>
              </div>

              {/* Credential Metrics Strip */}
              <div className="pt-6 border-t border-zinc-800 grid grid-cols-3 gap-6">
                <div>
                  <span className="font-mono text-2xl font-black text-white block">
                    7+ Yrs
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mt-0.5">
                    Global Advisory
                  </span>
                </div>
                <div>
                  <span className="font-mono text-2xl font-black text-white block">
                    UAE • CA • APAC
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mt-0.5">
                    Market Reach
                  </span>
                </div>
                <div>
                  <span className="font-mono text-2xl font-black text-[#FF7A1A] block">
                    100%
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mt-0.5">
                    Founder Oversight
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* FREQUENTLY ASKED QUESTIONS (#faq)                                     */}
      {/* ===================================================================== */}
      <section id="faq" className="relative z-10 py-24 border-t border-zinc-900 bg-[#08080A]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-4">
            <span className="text-xs font-mono uppercase tracking-widest text-[#FF7A1A] font-bold">
              TRANSPARENCY &amp; TIMELINE
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              Straightforward answers on timelines, single-service engagements, and how we
              collaborate with your team.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-zinc-800 bg-[#0A0A0C] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-900/40 transition-colors"
                  >
                    <span className="font-bold text-base text-white">
                      {faq.question}
                    </span>
                    <span className="h-8 w-8 rounded-full bg-[#141418] border border-zinc-800 flex items-center justify-center text-[#FF7A1A] shrink-0">
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-2 text-sm text-zinc-300 leading-relaxed border-t border-zinc-800/60 bg-[#0E0E12]/50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* FINAL CALL TO ACTION BANNER                                           */}
      {/* ===================================================================== */}
      <section className="relative z-10 py-24 border-t border-zinc-900 bg-gradient-to-b from-[#050505] to-[#0A0A0E] text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF7A1A]/30 bg-[#FF7A1A]/10 px-4 py-1.5 text-xs font-mono text-[#FF7A1A] font-bold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>READY TO BUILD UNSTOPPABLE MOMENTUM?</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Let&apos;s Build Your Brand Authority &amp; Scale Your Growth.
          </h2>

          <p className="text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            Partner directly with Roos StudioX to engineer a category-defining brand,
            ultra-responsive web platform, and automated revenue systems.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="w-full sm:w-auto px-9 py-4 rounded-full bg-[#FF7A1A] hover:bg-[#FF8833] text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xl shadow-[#FF7A1A]/40 flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
            >
              <span>Schedule Strategy Call</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <Link href="/app/acme-corp/overview" className="w-full sm:w-auto">
              <button
                type="button"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#121215] border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer"
              >
                Access Client Portal
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* REFINED STUDIO FOOTER                                                 */}
      {/* ===================================================================== */}
      <footer className="relative z-10 border-t border-zinc-900 bg-[#030304] py-16 text-xs text-zinc-400">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Column 1: Brand Info & Credentials */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FF7A1A] to-[#FF8833] text-black font-extrabold text-sm">
                  RX
                </div>
                <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
                  ROOS <span className="text-[#FF7A1A]">STUDIOX</span>
                  <span className="text-[10px] text-zinc-500 font-normal">®</span>
                </span>
              </div>
              <p className="text-zinc-400 max-w-sm leading-relaxed">
                Creative Intelligence Studio &amp; Growth Partner combining brand strategy,
                spatial design, modern engineering, and AI automation for ambitious brands.
              </p>
              <div className="pt-1 flex items-center gap-2 font-mono text-[11px] text-zinc-400">
                <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                  GSTIN: 29BZKPP8182N1Z8
                </span>
              </div>
            </div>

            {/* Column 2: System Map Navigation */}
            <div className="md:col-span-3 space-y-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FF7A1A]">
                SYSTEM MAP
              </span>
              <ul className="space-y-2 text-zinc-300">
                <li>
                  <a href="#services" className="hover:text-[#FF7A1A] transition-colors">
                    Core Services
                  </a>
                </li>
                <li>
                  <a href="#works" className="hover:text-[#FF7A1A] transition-colors">
                    Selected Works
                  </a>
                </li>
                <li>
                  <a href="#process" className="hover:text-[#FF7A1A] transition-colors">
                    The Momentum Engine
                  </a>
                </li>
                <li>
                  <a href="#approach" className="hover:text-[#FF7A1A] transition-colors">
                    Why StudioX
                  </a>
                </li>
                <li>
                  <a href="#about" className="hover:text-[#FF7A1A] transition-colors">
                    About StudioX
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-[#FF7A1A] transition-colors">
                    FAQs
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Global Hubs & Social */}
            <div className="md:col-span-4 space-y-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FF7A1A]">
                GLOBAL HUBS &amp; ADVISORY
              </span>
              <div className="space-y-1.5 text-zinc-400">
                <p className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Bangalore, India (HQ Hub)</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Dubai, United Arab Emirates (Advisory)</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Toronto, Ontario, Canada (Partner Network)</span>
                </p>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <a
                  href="https://www.linkedin.com/in/itsroosguy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-[#FF7A1A] transition-all"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-zinc-400">
            <p>© {new Date().getFullYear()} Roos StudioX. All rights reserved.</p>
            <p>DESIGNED &amp; ENGINEERED BY ROOS STUDIOX</p>
          </div>
        </div>
      </footer>

      {/* ===================================================================== */}
      {/* STRATEGIC INQUIRY & STRATEGY CALL MODAL DIALOG                        */}
      {/* ===================================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
            onClick={() => setModalOpen(false)}
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-lg rounded-3xl border border-zinc-800 bg-[#0D0D10] p-6 sm:p-8 shadow-2xl z-10 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[11px] font-mono text-[#FF7A1A] uppercase tracking-wider font-bold">
                  PROJECT INTAKE
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  Start Your Growth Sprint
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {submitted ? (
              <div className="py-12 text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <Check className="h-7 w-7" />
                </div>
                <h4 className="text-lg font-bold text-white">
                  Strategy Request Dispatched
                </h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  Thank you. Founder Praveen Raj will review your project scope and follow up
                  directly within 24 business hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Mercer"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#141418] border border-zinc-800 text-sm font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#FF7A1A] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. alex@company.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#141418] border border-zinc-800 text-sm font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#FF7A1A] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={formData.linkedin}
                    onChange={(e) =>
                      setFormData({ ...formData, linkedin: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#141418] border border-zinc-800 text-sm font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#FF7A1A] transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                      Engagement Scope
                    </label>
                    <select
                      value={formData.scope}
                      onChange={(e) =>
                        setFormData({ ...formData, scope: e.target.value })
                      }
                      className="w-full px-3 py-3 rounded-xl bg-[#141418] border border-zinc-800 text-xs font-medium text-white focus:outline-none focus:border-[#FF7A1A]"
                    >
                      <option>Brand Strategy &amp; Website Design</option>
                      <option>Next.js Custom Engineering</option>
                      <option>WhatsApp CRM &amp; Automation</option>
                      <option>Full Growth OS Partnership</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                      Target Budget
                    </label>
                    <select
                      value={formData.budget}
                      onChange={(e) =>
                        setFormData({ ...formData, budget: e.target.value })
                      }
                      className="w-full px-3 py-3 rounded-xl bg-[#141418] border border-zinc-800 text-xs font-medium text-white focus:outline-none focus:border-[#FF7A1A]"
                    >
                      <option>$5,000 – $15,000</option>
                      <option>$15,000 – $35,000</option>
                      <option>$35,000+</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                    Project Goals / Bottlenecks
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe your current bottlenecks or key target outcomes..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#141418] border border-zinc-800 text-sm font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#FF7A1A] transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#FF7A1A] hover:bg-[#FF8833] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#FF7A1A]/30 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Send className="h-4 w-4" />
                  <span>Send Project Inquiry</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
