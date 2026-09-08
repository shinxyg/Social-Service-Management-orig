import React, { useState } from 'react';
import { RefreshCw, Headphones, Info, Check } from 'lucide-react';

interface RecaptchaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifySuccess: () => void;
}

interface Challenge {
  prompt: string;
  keyword: string;
  images: { id: number; label: string; url: string }[];
  correctIds: number[];
}

const CHALLENGES: Challenge[] = [
  {
    prompt: 'traffic lights',
    keyword: 'traffic light',
    correctIds: [1, 4, 7, 8],
    images: [
      { id: 1, label: 'Traffic Light 1', url: 'https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=200&auto=format&fit=crop&q=80' },
      { id: 2, label: 'Street Road', url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=200&auto=format&fit=crop&q=80' },
      { id: 3, label: 'City Building', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&auto=format&fit=crop&q=80' },
      { id: 4, label: 'Traffic Light 2', url: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=200&auto=format&fit=crop&q=80' },
      { id: 5, label: 'Sidewalk', url: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=200&auto=format&fit=crop&q=80' },
      { id: 6, label: 'Urban Trees', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=200&auto=format&fit=crop&q=80' },
      { id: 7, label: 'Traffic Light 3', url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=200&auto=format&fit=crop&q=80' },
      { id: 8, label: 'Traffic Light 4', url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=200&auto=format&fit=crop&q=80' },
      { id: 9, label: 'Park Bench', url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=200&auto=format&fit=crop&q=80' },
    ],
  },
  {
    prompt: 'crosswalks / pedestrian crossings',
    keyword: 'crosswalk',
    correctIds: [2, 3, 5, 9],
    images: [
      { id: 1, label: 'Highway', url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=200&auto=format&fit=crop&q=80' },
      { id: 2, label: 'Crosswalk 1', url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=200&auto=format&fit=crop&q=80' },
      { id: 3, label: 'Crosswalk 2', url: 'https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=200&auto=format&fit=crop&q=80' },
      { id: 4, label: 'Building Wall', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&auto=format&fit=crop&q=80' },
      { id: 5, label: 'Crosswalk 3', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80' },
      { id: 6, label: 'Park Trail', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=200&auto=format&fit=crop&q=80' },
      { id: 7, label: 'Street Sign', url: 'https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=200&auto=format&fit=crop&q=80' },
      { id: 8, label: 'Car Wheel', url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=200&auto=format&fit=crop&q=80' },
      { id: 9, label: 'Crosswalk 4', url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=200&auto=format&fit=crop&q=80' },
    ],
  },
  {
    prompt: 'bicycles or motorcycles',
    keyword: 'bicycle',
    correctIds: [1, 3, 6, 7],
    images: [
      { id: 1, label: 'Bicycle 1', url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=200&auto=format&fit=crop&q=80' },
      { id: 2, label: 'City Street', url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=200&auto=format&fit=crop&q=80' },
      { id: 3, label: 'Bicycle 2', url: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=200&auto=format&fit=crop&q=80' },
      { id: 4, label: 'Wall', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&auto=format&fit=crop&q=80' },
      { id: 5, label: 'Walkway', url: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=200&auto=format&fit=crop&q=80' },
      { id: 6, label: 'Motorcycle 1', url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=200&auto=format&fit=crop&q=80' },
      { id: 7, label: 'Bicycle 3', url: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=200&auto=format&fit=crop&q=80' },
      { id: 8, label: 'Traffic Light', url: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=200&auto=format&fit=crop&q=80' },
      { id: 9, label: 'Trees', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=200&auto=format&fit=crop&q=80' },
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
      setErrorMessage('Please select at least one matching image.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    setTimeout(() => {
      setIsVerifying(false);
      onVerifySuccess();
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-[340px] overflow-hidden select-none animate-scale-up text-left">
        {/* Challenge Header */}
        <div className="bg-[#1A73E8] p-4 text-white">
          <p className="text-[12px] font-medium leading-tight opacity-90">
            Select all squares with
          </p>
          <h4 className="text-xl font-extrabold capitalize mt-0.5 tracking-tight">
            {currentChallenge.prompt}
          </h4>
          <p className="text-[11px] opacity-80 mt-1">
            If there are none, click skip or select the nearest matches.
          </p>
        </div>

        {/* 3x3 Image Grid */}
        <div className="p-2 bg-slate-100">
          <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded">
            {currentChallenge.images.map((img) => {
              const isSelected = selectedIds.includes(img.id);
              return (
                <div
                  key={img.id}
                  onClick={() => handleTileClick(img.id)}
                  className={`relative aspect-square cursor-pointer overflow-hidden group transition-all duration-150 ${
                    isSelected
                      ? 'ring-3 ring-inset ring-[#1A73E8] scale-[0.94] rounded-md shadow-sm'
                      : 'hover:opacity-90'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.label}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
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
          <div className="px-3 py-1.5 bg-red-50 border-t border-red-100 text-[11px] text-red-600 font-medium text-center">
            {errorMessage}
          </div>
        )}

        {/* Footer controls */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3 text-slate-500">
            <button
              type="button"
              onClick={handleNextChallenge}
              title="Get a new challenge"
              className="p-1.5 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => alert('Audio challenge is not required in visual mode.')}
              title="Audio challenge"
              className="p-1.5 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
            >
              <Headphones className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => alert('reCAPTCHA security challenge protects against automated bots.')}
              title="Help & Info"
              className="p-1.5 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying}
              className="px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] active:bg-[#10448A] text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm transition-colors cursor-pointer disabled:opacity-75 flex items-center gap-1.5"
            >
              {isVerifying ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying</span>
                </>
              ) : (
                'Verify'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
