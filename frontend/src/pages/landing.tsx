// src/pages/landing/LandingPage.tsx
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  MapPin,
  Home,
  FileCheck,
  ClipboardCheck,
  Construction,
} from 'lucide-react';

const features = [
  { icon: MapPin, title: 'AICS', description: 'Assistance to individuals in crisis — medical, burial, and educational support' },
  { icon: Home, title: 'PWD & Senior Citizen', description: 'Registration, ID issuance, and social pension enrollment' },
  { icon: FileCheck, title: 'Solo Parent & Child Welfare', description: 'Solo parent ID, benefits, and child welfare case monitoring' },
  { icon: ClipboardCheck, title: 'Livelihood & Training', description: 'Skills training, starter kits, and certification assistance' },
  { icon: Construction, title: 'Financial Aid Disbursement', description: 'Consolidated release tracking across all assistance programs' },
];

const stats = [
  { value: '100%', label: 'Digital Process' },
  { value: '24/7', label: 'System Access' },
  { value: '5+', label: 'Programs' },
  { value: 'Real-time', label: 'Updates' },
];

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
      </div>

      {/* Navigation */}
      <header className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
              <Sparkles size={22} className="text-white" />
            </div>
            <span className="font-heading text-xl font-bold">Social Services Management</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full">
              <Sparkles size={12} />
              Community Care Portal
            </span>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Sign In
              <ArrowRight size={16} />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-12 text-center">
        <div className="mx-auto max-w-4xl">
          <span className="inline-flex items-center gap-1.5 mb-6 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full">
            <Sparkles size={14} />
            Government Social Welfare Platform
          </span>

          <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
            Social Services Management
            <span className="block text-primary">
              Made Simple
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Streamline AICS crisis assistance, PWD and senior citizen services, solo parent
            and child welfare support, livelihood training, and financial aid disbursement —
            all in one unified platform.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-soft hover:opacity-90 transition-opacity"
            >
              Access the Portal
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Create an Account
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-6 text-center shadow-soft">
              <p className="text-3xl font-bold text-primary md:text-4xl">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="font-heading text-center text-2xl font-bold md:text-3xl">
          Complete Social Welfare Management Suite
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
          Everything you need to manage community welfare and assistance programs efficiently
        </p>

        <div className="mt-10 space-y-4">
          {/* First row — 3 cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.slice(0, 3).map((feature, idx) => (
              <div
                key={idx}
                className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-medium"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon size={24} />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Second row — 2 cards, centered */}
          <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
            {features.slice(3, 5).map((feature, idx) => (
              <div
                key={idx}
                className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-medium"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon size={24} />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 border-t border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <p className="text-sm text-muted-foreground">
              © 2026 Social Services Management System. Community Care Portal.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;