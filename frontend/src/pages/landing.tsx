// src/pages/landing/LandingPage.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  MapPin,
  Home,
  FileCheck,
  ClipboardCheck,
  Construction,
  Building2,
  Sun,
  Moon,
  X,
  Shield,
  FileText,
  Mail,
  Phone,
  MapPinned,
} from 'lucide-react';

const features = [
  { icon: MapPin, title: 'AICS', description: 'Assistance to individuals in crisis — medical, burial, and educational support' },
  { icon: Home, title: 'PWD & Senior Citizen', description: 'Registration, ID issuance, and social pension enrollment' },
  { icon: FileCheck, title: 'Solo Parent & Child Welfare', description: 'Solo parent ID, benefits, and child welfare case monitoring' },
  { icon: ClipboardCheck, title: 'Livelihood & Training', description: 'Skills training, starter kits, and certification assistance' },
  { icon: Construction, title: 'Financial Aid Disbursement', description: 'Consolidated release tracking across all assistance programs' },
  { icon: Building2, title: 'Multi-Program Coordination', description: 'One unified system connecting every office and program across departments' },
];

const stats = [
  { value: '100%', label: 'Digital Process' },
  { value: '24/7', label: 'System Access' },
  { value: '6', label: 'Programs' },
  { value: 'Real-time', label: 'Updates' },
];

// Cycles through the programs for the hero's typewriter phrase.
const TYPEWRITER_WORDS = ['AICS', 'PWD & Senior Citizen', 'Solo Parent', 'Livelihood', 'Financial Aid'];

function useTypewriter(words: string[], typingMs = 90, pauseMs = 1400, deletingMs = 45) {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'deleting'>('typing');

  useEffect(() => {
    const current = words[wordIndex];

    if (phase === 'typing') {
      if (text.length < current.length) {
        const t = setTimeout(() => setText(current.slice(0, text.length + 1)), typingMs);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase('pausing'), pauseMs);
      return () => clearTimeout(t);
    }

    if (phase === 'pausing') {
      const t = setTimeout(() => setPhase('deleting'), pauseMs);
      return () => clearTimeout(t);
    }

    // deleting
    if (text.length > 0) {
      const t = setTimeout(() => setText(current.slice(0, text.length - 1)), deletingMs);
      return () => clearTimeout(t);
    }
    setWordIndex((i) => (i + 1) % words.length);
    setPhase('typing');
  }, [text, phase, wordIndex, words, typingMs, pauseMs, deletingMs]);

  return text;
}

// Small decorative shapes that drift in the background — purely
// atmospheric, low-opacity, ignored by screen readers.
const FLOATING_ELEMENTS = [
  { Icon: MapPin, top: '18%', left: '8%', delay: '0s', size: 20 },
  { Icon: Home, top: '68%', left: '6%', delay: '-2s', size: 24 },
  { Icon: FileCheck, top: '22%', left: '90%', delay: '-4s', size: 18 },
  { Icon: ClipboardCheck, top: '72%', left: '92%', delay: '-1.5s', size: 22 },
  { Icon: Construction, top: '46%', left: '4%', delay: '-3.2s', size: 16 },
];

type FooterModalType = 'privacy' | 'terms' | 'contact' | null;

export function LandingPage() {
  const [activeModal, setActiveModal] = useState<FooterModalType>(null);
  const [dark, setDark] = useState(false);
  const typewriterText = useTypewriter(TYPEWRITER_WORDS);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      {/* Grid pattern overlay — faint structural texture, fades toward the edges */}
      <div
        className="pointer-events-none absolute inset-0 -z-20 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
        }}
      />

      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
      </div>

      {/* Floating decorative elements */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 hidden md:block">
        {FLOATING_ELEMENTS.map(({ Icon, top, left, delay, size }, i) => (
          <div
            key={i}
            className="absolute text-primary/10 animate-float"
            style={{ top, left, animationDelay: delay }}
          >
            <Icon size={size} />
          </div>
        ))}
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
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 border border-primary/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <Sparkles size={12} />
              Community Care Portal
            </span>
            <button
              type="button"
              onClick={() => setDark((v) => !v)}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground border border-border hover:bg-muted hover:text-foreground transition-colors"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
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
          <span className="inline-flex items-center gap-1.5 mb-6 text-xs font-medium text-primary bg-primary/10 border border-primary/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <Sparkles size={14} />
            Government Social Welfare Platform
          </span>

          <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
            <span className="block">Social Services Management</span>
            <span className="mt-2 flex items-center justify-center bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              <span>{typewriterText}</span>
              <span className="inline-block h-[0.85em] w-0.75 ml-1 bg-primary/70 animate-pulse" aria-hidden="true" />
            </span>
            <span className="block text-foreground">Made Simple</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Streamline AICS crisis assistance, PWD and senior citizen services, solo parent
            and child welfare support, livelihood training, and financial aid disbursement —
            all in one unified platform.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-primary text-primary-foreground text-sm font-medium shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity"
            >
              Access the Portal
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-2xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
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
              <p className="text-3xl md:text-4xl font-bold bg-linear-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                {stat.value}
              </p>
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

        {/* Single responsive grid — 1 col mobile, 2 tablet, 3 desktop, all 6 cards */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-medium hover:border-primary/30"
            >
              {/* Spotlight tint on hover */}
              <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <feature.icon size={24} />
              </div>
              <h3 className="relative font-semibold">{feature.title}</h3>
              <p className="relative mt-1 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
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
              <button
                onClick={() => setActiveModal('privacy')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </button>
              <button
                onClick={() => setActiveModal('terms')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms
              </button>
              <button
                onClick={() => setActiveModal('contact')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      {activeModal === 'privacy' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border p-6 relative max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-heading font-bold text-foreground">Privacy Policy</h3>
            </div>

            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                The Social Services Management System collects only the personal and household
                information needed to process applications for AICS, PWD & Senior Citizen
                services, Solo Parent & Child Welfare support, Livelihood & Training programs,
                and Financial Aid Disbursement.
              </p>
              <p>
                Information you submit — such as your name, address, contact details, and
                supporting documents — is used solely by authorized social workers and staff
                to verify eligibility, process your application, and release assistance. Your
                data is not sold or shared with third parties for marketing purposes.
              </p>
              <p>
                Records are retained only for as long as necessary to fulfill program
                requirements and comply with local government reporting obligations. You may
                request to review or correct your submitted information by visiting your
                barangay social welfare office.
              </p>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full mt-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {activeModal === 'terms' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border p-6 relative max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-heading font-bold text-foreground">Terms of Service</h3>
            </div>

            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                By creating an account and using this portal, you agree to provide accurate and
                truthful information in all applications for assistance. Submitting false or
                misleading information may result in the denial or cancellation of benefits.
              </p>
              <p>
                Access to the resident portal is intended for individuals applying for
                assistance on their own behalf or on behalf of their household. Staff and
                social worker accounts are provisioned separately and are subject to their
                agency's internal use policies.
              </p>
              <p>
                This platform is a tool for submitting and tracking applications. Final approval
                of any assistance program remains subject to review, verification, and
                availability of funds as determined by the appropriate social welfare office.
              </p>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full mt-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {activeModal === 'contact' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-heading font-bold text-foreground">Contact Us</h3>
            </div>

            <p className="text-sm text-muted-foreground mb-5">
              Have questions about your application or need help with the portal? Reach out
              through any of the channels below, or visit your barangay social welfare office.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground truncate">
                    socialservices@gov.ph
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Hotline</p>
                  <p className="text-sm font-medium text-foreground">(02) 8888-0000</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <MapPinned className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Office</p>
                  <p className="text-sm font-medium text-foreground">
                    City Social Welfare and Development Office
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full mt-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;