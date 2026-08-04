import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Mail, HeartHandshake, ShieldCheck, CheckCircle2, Users, X, Info, User } from 'lucide-react';

interface ModuleInfo {
  title: string;
  description: string;
  features: string[];
}

const moduleDetails: Record<string, ModuleInfo> = {
  aics: {
    title: 'AICS (Assistance to Individuals in Crisis)',
    description: 'Provides immediate medical, financial, burial, and educational support to individuals and families experiencing unexpected crises or emergencies.',
    features: ['Medical Bill Subsidies', 'Emergency Burial Assistance', 'Crisis Intervention Support']
  },
  pwd: {
    title: 'PWD & Senior Citizen Services',
    description: 'Dedicated welfare tracking, ID processing, social pension distribution, and specialized healthcare benefits for senior citizens and persons with disabilities.',
    features: ['Monthly Social Pension', 'Disability Support Equipment', 'Priority Lane Identification']
  },
  soloparent: {
    title: 'Solo Parent & Child Welfare Support',
    description: 'Comprehensive assistance programs including livelihood training, discounts, counseling, and developmental support for solo parents and their dependents.',
    features: ['Solo Parent ID & Booklet', 'Educational Grants for Children', 'Livelihood Capital Support']
  },
  livelihood: {
    title: 'Livelihood & Training Program',
    description: 'Skills development workshops, technical training courses, and micro-enterprise startup grants designed to uplift community employment rates.',
    features: ['Technical-Vocational Courses', 'Small Business Seed Grants', 'Job Fair Placements']
  },
  financial: {
    title: 'Financial Aid Disbursement',
    description: 'Secure, transparent, and direct tracking of cash assistance programs distributed across qualified low-income households and vulnerable sectors.',
    features: ['Automated Beneficiary Matching', 'Direct Cash Payout Tracking', 'Disbursement Audit Logs']
  }
};

export const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [selectedModule, setSelectedModule] = useState<ModuleInfo | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Public self-registration is for residents only. Staff accounts are
    // provisioned separately and sign in through the Staff / Social Worker
    // option on the Login page.
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userRole', 'user');
    window.location.href = '/portal/aics';
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#F8FAFC] font-sans text-sm relative" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Left Hero Section */}
      <div
        className="w-full md:w-1/2 text-white p-6 md:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden text-center md:text-center items-center md:items-center"
        style={{ backgroundColor: '#0F172A' }}
      >
        {/* Header / Logo */}
        <div className="flex items-center justify-start gap-2.5 z-10 w-full">
          <span className="font-bold tracking-wide" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '18px' }}>
            SOCIAL SERVICES MANAGEMENT
          </span>
        </div>

        {/* Hero Content - Centered */}
        <div className="my-auto py-8 z-10 max-w-lg text-center flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 leading-tight text-white text-center" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Social Services Management Portal
          </h1>
          <p className="text-slate-300 text-sm md:text-base mb-6 leading-relaxed font-medium text-center">
            Streamlining community welfare, financial aid, and support programs for residents in need. Click any module below to learn more.
          </p>

          {/* Quick Feature Grid */}
          <div className="flex flex-col gap-2.5 w-full items-center">
            {/* 1st Row: 3 items */}
            <div className="grid grid-cols-3 gap-2.5 w-full">
              <button 
                onClick={() => setSelectedModule(moduleDetails.aics)}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white font-medium transition-all text-center cursor-pointer"
              >
                <HeartHandshake className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-[11px] md:text-xs truncate">AICS</span>
              </button>
              <button 
                onClick={() => setSelectedModule(moduleDetails.pwd)}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white font-medium transition-all text-center cursor-pointer"
              >
                <Users className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-[11px] md:text-xs truncate">PWD & Senior</span>
              </button>
              <button 
                onClick={() => setSelectedModule(moduleDetails.soloparent)}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white font-medium transition-all text-center cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-[11px] md:text-xs truncate">Solo Parent</span>
              </button>
            </div>

            {/* 2nd Row: 2 items centered */}
            <div className="grid grid-cols-2 gap-2.5 w-2/3">
              <button 
                onClick={() => setSelectedModule(moduleDetails.livelihood)}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white font-medium transition-all text-center cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-[11px] md:text-xs truncate">Livelihood & Training</span>
              </button>
              <button 
                onClick={() => setSelectedModule(moduleDetails.financial)}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white font-medium transition-all text-center cursor-pointer"
              >
                <HeartHandshake className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-[11px] md:text-xs truncate">Financial Aid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Info inside Hero */}
        <div className="text-[11px] text-slate-400 font-medium z-10 text-center w-full">
          © Social Services Management System • Community Care Portal
        </div>
      </div>

      {/* Right Register Form Section */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-10 bg-[#F8FAFC]">
        <div className="w-full max-w-sm bg-white p-6 md:p-8 rounded-2xl shadow-xl shadow-blue-500/5 border border-slate-200">

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Create Account
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Register a new resident account to access the Social Services portal
            </p>
          </div>

          {error && (
            <div className="p-2.5 mb-4 text-xs text-red-600 bg-red-50 rounded-lg border border-red-200 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider text-left">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  className="w-full pl-9 pr-3 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-700 text-left"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider text-left">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="socialworker@gov.ph"
                  className="w-full pl-9 pr-3 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-700 text-left"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider text-left">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-700 text-left"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider text-left">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-700 text-left"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-medium text-xs md:text-sm rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 cursor-pointer mt-2"
            >
              Sign Up
            </button>
          </form>

          <div className="mt-6 text-center space-y-1.5">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </div>

        </div>
      </div>

      {/* Module Information Modal */}
      {selectedModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 p-6 relative overflow-hidden text-left">
            <button 
              onClick={() => setSelectedModule(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Info className="w-6 h-6" />
              </div>
              <div className="text-left">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                  Module Information
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {selectedModule.title}
                </h3>
              </div>
            </div>

            <p className="text-xs md:text-sm text-slate-600 leading-relaxed mb-6 text-left">
              {selectedModule.description}
            </p>

            <div className="mb-6 text-left">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                Key Services & Features
              </h4>
              <ul className="space-y-2">
                {selectedModule.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-left">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setSelectedModule(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Register;