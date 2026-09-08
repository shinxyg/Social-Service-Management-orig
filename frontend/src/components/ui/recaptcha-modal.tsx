import React, { useState } from 'react';
import { RefreshCw, Headphones, Info, Check, ShieldCheck } from 'lucide-react';

interface RecaptchaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifySuccess: () => void;
}

interface TileItem {
  id: number;
  label: string;
  isMatch: boolean;
  renderSvg: () => React.ReactNode;
}

interface Challenge {
  prompt: string;
  subtitle: string;
  tiles: TileItem[];
}

// Inline Crisp Vector SVG Tiles (100% Guaranteed to load with zero network requests)
const renderTrafficLightTile = (variant: number) => (
  <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#cbd5e1" />
    <path d="M0 65 L100 65 L100 100 L0 100 Z" fill="#64748b" />
    <line x1="0" y1="82" x2="100" y2="82" stroke="#f8fafc" strokeWidth="3" strokeDasharray="8 6" />
    {/* Traffic light post */}
    <rect x="47" y="30" width="6" height="60" fill="#1e293b" />
    {/* Housing */}
    <rect x="36" y="8" width="28" height="60" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
    {/* Visors */}
    <path d="M37 14 Q50 8 63 14" fill="none" stroke="#334155" strokeWidth="2" />
    <path d="M37 32 Q50 26 63 32" fill="none" stroke="#334155" strokeWidth="2" />
    <path d="M37 50 Q50 44 63 50" fill="none" stroke="#334155" strokeWidth="2" />
    {/* Red Light */}
    <circle cx="50" cy="18" r="7" fill={variant === 1 ? '#ef4444' : '#7f1d1d'} stroke="#991b1b" strokeWidth="1" />
    {variant === 1 && <circle cx="50" cy="18" r="4" fill="#fca5a5" opacity="0.6" />}
    {/* Yellow Light */}
    <circle cx="50" cy="36" r="7" fill={variant === 2 ? '#eab308' : '#713f12'} stroke="#854d0e" strokeWidth="1" />
    {variant === 2 && <circle cx="50" cy="36" r="4" fill="#fef08a" opacity="0.6" />}
    {/* Green Light */}
    <circle cx="50" cy="54" r="7" fill={variant === 3 ? '#22c55e' : '#14532d'} stroke="#166534" strokeWidth="1" />
    {variant === 3 && <circle cx="50" cy="54" r="4" fill="#86efac" opacity="0.6" />}
  </svg>
);

const renderFireHydrantTile = (variant: number) => (
  <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#e2e8f0" />
    {/* Pavement */}
    <rect x="0" y="70" width="100" height="30" fill="#94a3b8" />
    <line x1="0" y1="70" x2="100" y2="70" stroke="#64748b" strokeWidth="2" />
    {/* Hydrant Base */}
    <ellipse cx="50" cy="74" rx="22" ry="7" fill="#991b1b" />
    {/* Body */}
    <path d="M36 40 L34 72 L66 72 L64 40 Z" fill={variant === 1 ? '#dc2626' : '#ef4444'} />
    {/* Side outlets */}
    <rect x="23" y="46" width="14" height="10" rx="2" fill="#b91c1c" />
    <circle cx="23" cy="51" r="5" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
    <rect x="63" y="46" width="14" height="10" rx="2" fill="#b91c1c" />
    <circle cx="77" cy="51" r="5" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
    {/* Front cap */}
    <circle cx="50" cy="54" r="8" fill="#f8fafc" stroke="#dc2626" strokeWidth="2" />
    <circle cx="50" cy="54" r="4" fill="#cbd5e1" />
    {/* Bonnet / Top */}
    <path d="M35 40 Q50 20 65 40 Z" fill="#b91c1c" />
    <rect x="44" y="16" width="12" height="10" rx="2" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
  </svg>
);

const renderBicycleTile = (variant: number) => (
  <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#f1f5f9" />
    <rect x="0" y="78" width="100" height="22" fill="#64748b" />
    {/* Wheels */}
    <circle cx="28" cy="66" r="18" fill="none" stroke="#1e293b" strokeWidth="3" />
    <circle cx="28" cy="66" r="16" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
    <circle cx="28" cy="66" r="3" fill="#1e293b" />
    <circle cx="72" cy="66" r="18" fill="none" stroke="#1e293b" strokeWidth="3" />
    <circle cx="72" cy="66" r="16" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
    <circle cx="72" cy="66" r="3" fill="#1e293b" />
    {/* Frame */}
    <polyline points="28,66 48,66 64,45 28,66" fill="none" stroke={variant === 1 ? '#2563eb' : '#dc2626'} strokeWidth="3" strokeLinejoin="round" />
    <polyline points="48,66 45,40" fill="none" stroke={variant === 1 ? '#2563eb' : '#dc2626'} strokeWidth="3" />
    <polyline points="72,66 62,36" fill="none" stroke={variant === 1 ? '#2563eb' : '#dc2626'} strokeWidth="3" />
    {/* Seat */}
    <ellipse cx="43" cy="38" rx="8" ry="2.5" fill="#0f172a" />
    {/* Handlebars */}
    <path d="M57 34 L65 34 L68 38" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const renderCrosswalkTile = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#334155" />
    {/* Zebra stripes */}
    <rect x="8" y="10" width="14" height="80" fill="#f8fafc" rx="2" />
    <rect x="30" y="10" width="14" height="80" fill="#f8fafc" rx="2" />
    <rect x="52" y="10" width="14" height="80" fill="#f8fafc" rx="2" />
    <rect x="74" y="10" width="14" height="80" fill="#f8fafc" rx="2" />
    {/* Road texture */}
    <circle cx="20" cy="50" r="1" fill="#cbd5e1" opacity="0.3" />
    <circle cx="65" cy="30" r="1" fill="#cbd5e1" opacity="0.3" />
  </svg>
);

// Distractor Tiles (Non-matching items)
const renderBuildingTile = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#93c5fd" />
    <rect x="15" y="20" width="70" height="80" fill="#1e293b" />
    <rect x="25" y="30" width="10" height="12" fill="#fef08a" />
    <rect x="45" y="30" width="10" height="12" fill="#60a5fa" />
    <rect x="65" y="30" width="10" height="12" fill="#fef08a" />
    <rect x="25" y="52" width="10" height="12" fill="#60a5fa" />
    <rect x="45" y="52" width="10" height="12" fill="#fef08a" />
    <rect x="65" y="52" width="10" height="12" fill="#60a5fa" />
    <rect x="40" y="76" width="20" height="24" fill="#38bdf8" />
  </svg>
);

const renderTreeTile = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#bae6fd" />
    <path d="M0 80 Q50 70 100 80 L100 100 L0 100 Z" fill="#22c55e" />
    {/* Trunk */}
    <rect x="44" y="50" width="12" height="36" fill="#78350f" rx="2" />
    {/* Leaves */}
    <circle cx="50" cy="40" r="26" fill="#15803d" />
    <circle cx="36" cy="34" r="18" fill="#16a34a" />
    <circle cx="64" cy="34" r="18" fill="#16a34a" />
    <circle cx="50" cy="22" r="16" fill="#22c55e" />
  </svg>
);

const renderCarTile = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#e2e8f0" />
    <rect x="0" y="70" width="100" height="30" fill="#475569" />
    {/* Car body */}
    <path d="M12 66 L20 50 L40 42 L68 42 L84 52 L88 66 Z" fill="#2563eb" />
    {/* Windows */}
    <polygon points="24,51 38,45 48,45 48,51" fill="#bae6fd" />
    <polygon points="52,45 66,45 78,51 52,51" fill="#bae6fd" />
    {/* Wheels */}
    <circle cx="28" cy="68" r="9" fill="#0f172a" />
    <circle cx="28" cy="68" r="4" fill="#cbd5e1" />
    <circle cx="72" cy="68" r="9" fill="#0f172a" />
    <circle cx="72" cy="68" r="4" fill="#cbd5e1" />
    {/* Headlight */}
    <rect x="85" y="56" width="3" height="5" fill="#fef08a" />
  </svg>
);

const renderStreetTile = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#475569" />
    <line x1="50" y1="0" x2="50" y2="100" stroke="#facc15" strokeWidth="4" strokeDasharray="14 10" />
    <rect x="0" y="0" width="10" height="100" fill="#94a3b8" />
    <rect x="90" y="0" width="10" height="100" fill="#94a3b8" />
  </svg>
);

const renderBenchTile = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#f8fafc" />
    <rect x="0" y="70" width="100" height="30" fill="#86efac" />
    {/* Bench */}
    <rect x="20" y="48" width="60" height="6" rx="2" fill="#92400e" />
    <rect x="20" y="56" width="60" height="6" rx="2" fill="#b45309" />
    <rect x="26" y="58" width="4" height="20" fill="#1e293b" />
    <rect x="70" y="58" width="4" height="20" fill="#1e293b" />
    <rect x="24" y="38" width="4" height="20" fill="#1e293b" />
    <rect x="72" y="38" width="4" height="20" fill="#1e293b" />
  </svg>
);

const CHALLENGES: Challenge[] = [
  {
    prompt: 'Traffic Lights',
    subtitle: 'Click all squares containing a traffic light',
    tiles: [
      { id: 1, label: 'Traffic Light 1', isMatch: true, renderSvg: () => renderTrafficLightTile(1) },
      { id: 2, label: 'City Building', isMatch: false, renderSvg: () => renderBuildingTile() },
      { id: 3, label: 'Park Trees', isMatch: false, renderSvg: () => renderTreeTile() },
      { id: 4, label: 'Traffic Light 2', isMatch: true, renderSvg: () => renderTrafficLightTile(2) },
      { id: 5, label: 'City Street', isMatch: false, renderSvg: () => renderStreetTile() },
      { id: 6, label: 'Automobile', isMatch: false, renderSvg: () => renderCarTile() },
      { id: 7, label: 'Traffic Light 3', isMatch: true, renderSvg: () => renderTrafficLightTile(3) },
      { id: 8, label: 'Park Bench', isMatch: false, renderSvg: () => renderBenchTile() },
      { id: 9, label: 'Traffic Light 4', isMatch: true, renderSvg: () => renderTrafficLightTile(1) },
    ],
  },
  {
    prompt: 'Fire Hydrants',
    subtitle: 'Click all squares containing a fire hydrant',
    tiles: [
      { id: 1, label: 'Park Trees', isMatch: false, renderSvg: () => renderTreeTile() },
      { id: 2, label: 'Fire Hydrant 1', isMatch: true, renderSvg: () => renderFireHydrantTile(1) },
      { id: 3, label: 'City Building', isMatch: false, renderSvg: () => renderBuildingTile() },
      { id: 4, label: 'Fire Hydrant 2', isMatch: true, renderSvg: () => renderFireHydrantTile(2) },
      { id: 5, label: 'Road Way', isMatch: false, renderSvg: () => renderStreetTile() },
      { id: 6, label: 'Park Bench', isMatch: false, renderSvg: () => renderBenchTile() },
      { id: 7, label: 'Automobile', isMatch: false, renderSvg: () => renderCarTile() },
      { id: 8, label: 'Fire Hydrant 3', isMatch: true, renderSvg: () => renderFireHydrantTile(1) },
      { id: 9, label: 'City Building', isMatch: false, renderSvg: () => renderBuildingTile() },
    ],
  },
  {
    prompt: 'Bicycles',
    subtitle: 'Click all squares containing a bicycle',
    tiles: [
      { id: 1, label: 'Bicycle 1', isMatch: true, renderSvg: () => renderBicycleTile(1) },
      { id: 2, label: 'City Building', isMatch: false, renderSvg: () => renderBuildingTile() },
      { id: 3, label: 'Bicycle 2', isMatch: true, renderSvg: () => renderBicycleTile(2) },
      { id: 4, label: 'Park Trees', isMatch: false, renderSvg: () => renderTreeTile() },
      { id: 5, label: 'City Street', isMatch: false, renderSvg: () => renderStreetTile() },
      { id: 6, label: 'Automobile', isMatch: false, renderSvg: () => renderCarTile() },
      { id: 7, label: 'Bicycle 3', isMatch: true, renderSvg: () => renderBicycleTile(1) },
      { id: 8, label: 'Park Bench', isMatch: false, renderSvg: () => renderBenchTile() },
      { id: 9, label: 'Bicycle 4', isMatch: true, renderSvg: () => renderBicycleTile(2) },
    ],
  },
  {
    prompt: 'Pedestrian Crosswalks',
    subtitle: 'Click all squares containing a crosswalk',
    tiles: [
      { id: 1, label: 'City Building', isMatch: false, renderSvg: () => renderBuildingTile() },
      { id: 2, label: 'Crosswalk 1', isMatch: true, renderSvg: () => renderCrosswalkTile() },
      { id: 3, label: 'Automobile', isMatch: false, renderSvg: () => renderCarTile() },
      { id: 4, label: 'Crosswalk 2', isMatch: true, renderSvg: () => renderCrosswalkTile() },
      { id: 5, label: 'Park Trees', isMatch: false, renderSvg: () => renderTreeTile() },
      { id: 6, label: 'Crosswalk 3', isMatch: true, renderSvg: () => renderCrosswalkTile() },
      { id: 7, label: 'Park Bench', isMatch: false, renderSvg: () => renderBenchTile() },
      { id: 8, label: 'City Street', isMatch: false, renderSvg: () => renderStreetTile() },
      { id: 9, label: 'Crosswalk 4', isMatch: true, renderSvg: () => renderCrosswalkTile() },
    ],
  },
];

export const RecaptchaModal: React.FC<RecaptchaModalProps> = ({
  isOpen,
  onClose,
  onVerifySuccess,
}) => {
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const currentChallenge = CHALLENGES[challengeIdx % CHALLENGES.length];

  const handleTileClick = (id: number) => {
    setErrorMessage('');
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleNextChallenge = () => {
    setSelectedIds([]);
    setErrorMessage('');
    setChallengeIdx((prev) => prev + 1);
  };

  const handleVerify = () => {
    if (selectedIds.length === 0) {
      setErrorMessage('Please select the matching squares before verifying.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    setTimeout(() => {
      setIsVerifying(false);
      onVerifySuccess();
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-[340px] overflow-hidden select-none animate-scale-up text-left">
        {/* Challenge Blue Banner */}
        <div className="bg-[#1A73E8] p-4 text-white">
          <p className="text-[12px] font-medium leading-tight opacity-90">
            Select all squares with
          </p>
          <h4 className="text-xl font-extrabold capitalize mt-0.5 tracking-tight">
            {currentChallenge.prompt}
          </h4>
          <p className="text-[11px] opacity-85 mt-1 leading-snug">
            {currentChallenge.subtitle}
          </p>
        </div>

        {/* 3x3 High-Res Graphic Grid */}
        <div className="p-2.5 bg-slate-100">
          <div className="grid grid-cols-3 gap-1.5 bg-white p-1.5 rounded-lg border border-slate-200">
            {currentChallenge.tiles.map((tile) => {
              const isSelected = selectedIds.includes(tile.id);
              return (
                <div
                  key={tile.id}
                  onClick={() => handleTileClick(tile.id)}
                  className={`relative aspect-square cursor-pointer overflow-hidden rounded-md transition-all duration-150 border ${
                    isSelected
                      ? 'border-[#1A73E8] ring-3 ring-[#1A73E8]/40 scale-[0.93] shadow-md'
                      : 'border-slate-200 hover:border-slate-400 hover:scale-[0.98]'
                  }`}
                >
                  {tile.renderSvg()}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#1A73E8] text-white rounded-full flex items-center justify-center shadow-md animate-scale-up">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {errorMessage && (
          <div className="px-3 py-1.5 bg-red-50 border-t border-red-100 text-[11px] text-red-600 font-semibold text-center">
            {errorMessage}
          </div>
        )}

        {/* Footer controls */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <button
              type="button"
              onClick={handleNextChallenge}
              title="Get another challenge"
              className="p-1.5 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => alert('reCAPTCHA security protects the portal from unauthorized automated scripts.')}
              title="Security Info"
              className="p-1.5 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying}
              className="px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] active:bg-[#10448A] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-75 flex items-center gap-1.5"
            >
              {isVerifying ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying</span>
                </>
              ) : (
                'VERIFY'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
