import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, X, Eye, EyeOff } from 'lucide-react';
import { API_BASE } from '../../config/api';

export const Login = () => {
  const navigate = useNavigate();

  // Government seal mula sa public/samples folder
  const governmentSealImage = '/samples/Government Service Integrity Seal.png';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isNotRobot, setIsNotRobot] = useState(false);
  const [isVerifyingRobot, setIsVerifyingRobot] = useState(false);   
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);

  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const handleRegisterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsRegisterLoading(true);

    setTimeout(() => {
      navigate('/register');
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (email && password) {
      setIsLoginLoading(true);
      setError('');

      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        const detectedRole = data.role || (email.toLowerCase().includes('admin') ? 'staff' : 'user');
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', detectedRole);
        if (data.user) {
          localStorage.setItem('currentUser', JSON.stringify(data.user));
        }

        setTimeout(() => {
          window.location.href = detectedRole === 'staff' ? '/aics' : '/portal/aics';
        }, 1200);
      } catch (err) {
        // Fallback
        const detectedRole = email.toLowerCase().includes('admin') ? 'staff' : 'user';
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', detectedRole);
        setTimeout(() => {
          window.location.href = detectedRole === 'staff' ? '/aics' : '/portal/aics';
        }, 1200);
      }
    } else {
      setError('Please enter your username and password.');
    }
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (!resetEmail) {
      setResetError('Please enter your registered email address.');
      return;
    }

    if (!isNotRobot) {
      setResetError('Please verify that you are not a robot.');
      return;
    }

    // Buksan yung confirmation dialog (Image 3)
    setIsConfirmModalOpen(true);
  };

  const handleConfirmReset = () => {
    setIsConfirmModalOpen(false);
    setIsResetLoading(true);

    // Simulate sending reset email
    setTimeout(() => {
      setIsResetLoading(false);
      setResetSuccess(true);
    }, 1500);
  };

  const closeForgotPasswordModal = () => {
    setIsForgotPasswordOpen(false);
    setIsConfirmModalOpen(false);
    setResetEmail('');
    setIsNotRobot(false);
    setResetError('');
    setResetSuccess(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#F8FAFC] font-sans text-sm relative" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Left Hero Section — UNTOUCHED */}
      <div
        className="w-full md:w-1/2 text-white p-4 sm:p-6 md:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden text-center md:text-center items-center md:items-center"
        style={{ backgroundColor: '#0F172A' }}
      >
        {/* Centered Government Seal Watermark - Large and Prominent */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="w-112.5 h-112.5 md:w-162.5 md:h-162.5 opacity-[0.12] md:opacity-[0.15]">
            <img
              src={governmentSealImage}
              alt="Government Seal"
              className="w-full h-full object-contain"
              style={{
                filter: 'brightness(2.2) contrast(1.8) saturate(0.9)',
                mixBlendMode: 'overlay',
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between z-10 w-full">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white font-medium transition-colors shrink-0"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="my-auto py-6 sm:py-8 z-10 max-w-lg text-center flex flex-col items-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-3 leading-tight text-white text-center" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Social Services Management Portal
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm md:text-base mb-6 leading-relaxed font-medium text-center">
            Streamlining community welfare, financial aid, and support programs for residents in need.
          </p>
        </div>

        <div className="text-[11px] text-slate-400 font-medium z-10 text-center w-full">
          © Social Services Management System • Community Care Portal
        </div>
      </div>

      {/* Right Login Form Section — REDESIGNED */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-[#F8FAFC]">
        <div className="w-full max-w-sm p-6 sm:p-8 rounded-2xl">

          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Welcome Back!
            </h2>
            <p className="text-xs text-slate-500 mt-1.5">
              Sign in to access your Social Services dashboard
            </p>
          </div>

          {error && (
            <div className="p-2.5 mb-4 text-xs text-red-600 bg-red-50 rounded-lg border border-red-200 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Username or Email (e.g. user123, admin123)"
                  className="w-full pl-9 pr-3 py-2.5 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-700 text-left"
                  required
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-9 pr-9 py-2.5 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-700 text-left"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
                type="submit"
                disabled={isLoginLoading}
                className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] disabled:opacity-60 disabled:cursor-wait text-white font-semibold text-xs md:text-sm rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 cursor-pointer mt-2"
              >
                {isLoginLoading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 pt-2 flex items-center justify-between gap-4 text-xs">
            <button
              type="button"
              onClick={() => {
                setIsForgotPasswordOpen(true);
                setResetSuccess(false);
                setResetEmail('');
                setIsNotRobot(false);
                setResetError('');
                setIsConfirmModalOpen(false);
              }}
              className="text-blue-600 hover:underline font-medium bg-transparent border-none cursor-pointer p-0 shrink-0"
            >
              Forgot password?
            </button>

            <span className="text-slate-300 select-none">|</span>

            <p className="text-slate-400 m-0 text-right">
              Don't have an account?{' '}
              <a
                href="/register"
                onClick={handleRegisterClick}
                className="text-blue-600 hover:underline font-semibold cursor-pointer whitespace-nowrap"
              >
                Register here
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden text-left max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeForgotPasswordModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {resetSuccess ? (
              <div className="text-center py-2">
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#0F3D5C] mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  Check your email
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-6">
                  We've sent a password reset link to <span className="font-semibold text-slate-700">{resetEmail}</span>.
                </p>
                <button
                  onClick={closeForgotPasswordModal}
                  className="w-full py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white font-medium text-xs sm:text-sm rounded-lg transition-colors cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-5">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#0F3D5C]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    Forgot your password?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                    No worries! Simply provide your registered email to reset your password.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 sm:p-5">
                  <p className="text-center text-xs sm:text-sm font-semibold text-[#0F3D5C] mb-3">
                    Please enter your registered Email Address
                  </p>

                  {resetError && (
                    <div className="p-2.5 mb-3 text-xs text-red-600 bg-red-50 rounded-lg border border-red-200 text-center">
                      {resetError}
                    </div>
                  )}

                  <form onSubmit={handleResetSubmit} className="space-y-4 text-left">
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Input your E-Mail Address"
                      className="w-full px-3 py-2.5 text-xs md:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-slate-700 text-left"
                      required
                    />

                        <button
                          type="button"
                          onClick={() => {
                            if (isNotRobot || isVerifyingRobot) {
                              setIsNotRobot(false);
                              return;
                            }
                            setIsVerifyingRobot(true);
                            setTimeout(() => {
                              setIsVerifyingRobot(false);
                              setIsNotRobot(true);
                            }, 1000);
                          }}
                          disabled={isVerifyingRobot}
                          className="w-full flex items-center justify-between gap-3 border border-slate-300 rounded-lg bg-slate-50 px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors disabled:opacity-70 disabled:cursor-wait"
                        >
                          <span className="flex items-center gap-2.5">
                            <span
                              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                isNotRobot ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-400'
                              }`}
                            >
                              {isVerifyingRobot ? (
                                <svg className="w-3 h-3 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                                </svg>
                              ) : (
                                isNotRobot && (
                                  <svg viewBox="0 0 20 20" fill="white" className="w-3.5 h-3.5">
                                    <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.4 7.4a1 1 0 0 1-1.4 0L3.3 9.5a1 1 0 1 1 1.4-1.4L8.6 12l6.7-6.7a1 1 0 0 1 1.4 0z" />
                                  </svg>
                                )
                              )}
                            </span>
                            <span className="text-xs sm:text-sm text-slate-700">
                              {isVerifyingRobot ? 'Verifying...' : "I'm not a robot"}
                            </span>
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium leading-tight text-right">
                            reCAPTCHA
                          </span>
                        </button>

                    <button
                      type="submit"
                      disabled={isResetLoading}
                      className="w-full py-2.5 px-4 bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] disabled:opacity-60 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-sm transition-colors duration-200 cursor-pointer"
                    >
                      {isResetLoading ? 'Sending...' : 'Submit'}
                    </button>
                  </form>

                  <p className="text-center text-xs text-slate-500 mt-4">
                    Go back to{' '}
                    <button
                      type="button"
                      onClick={closeForgotPasswordModal}
                      className="text-blue-600 hover:underline font-medium bg-transparent border-none cursor-pointer p-0"
                    >
                      Login page
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Password Reset Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-110 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 sm:p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full border-2 border-sky-400 flex items-center justify-center text-sky-400">
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="12" cy="8" r="0.9" fill="currentColor" />
                  <rect x="11.1" y="10.5" width="1.8" height="6" rx="0.6" fill="currentColor" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-700 mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Password Reset Confirmation
            </h3>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 py-2.5 px-4 border border-amber-500 text-amber-600 hover:bg-amber-50 font-semibold text-xs sm:text-sm rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="flex-1 py-2.5 px-4 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold text-xs sm:text-sm rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}
          {isLoginLoading && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8 sm:p-10 text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-700 mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Signing in
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 tracking-wide mb-6">
              PLEASE WAIT
            </p>
            <div className="flex justify-center">
              <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            </div>
          </div>
        </div>
      )}

      {isRegisterLoading && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8 sm:p-10 text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-700 mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Loading
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 tracking-wide mb-6">
              PLEASE WAIT
            </p>
            <div className="flex justify-center">
              <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            </div>
          </div>
        </div>
      )}

     

    </div>
  );
};

export default Login;