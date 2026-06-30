import React, { useState } from 'react';
import { Camera, Sparkles, Upload, Check } from 'lucide-react';
import type { CurrencyCode } from '../services/currency';

interface OcrScannerProps {
  onScanSuccess: (data: {
    amount: number;
    category: string;
    note: string;
    currency: CurrencyCode;
  }) => void;
}

const PRESETS = {
  uber: {
    name: 'Uber Black Receipt',
    amount: 45.00,
    category: 'Transport',
    note: 'Uber Black Ride',
    currency: 'USD' as CurrencyCode,
  },
  starbucks: {
    name: 'Starbucks Coffee',
    amount: 12.80,
    category: 'Food',
    note: 'Starbucks Coffee & Pastry',
    currency: 'USD' as CurrencyCode,
  },
  aws: {
    name: 'AWS Cloud Invoice',
    amount: 145.20,
    category: 'Bills',
    note: 'AWS Cloud Hosting',
    currency: 'EUR' as CurrencyCode,
  }
};

export const OcrScanner: React.FC<OcrScannerProps> = ({ onScanSuccess }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handleScanPreset = (key: keyof typeof PRESETS) => {
    if (isScanning) return;
    
    setIsScanning(true);
    setScanComplete(false);
    setActivePreset(key);

    // Simulate OCR scanning latency (laser sweeping)
    setTimeout(() => {
      onScanSuccess(PRESETS[key]);
      setIsScanning(false);
      setScanComplete(true);
      setActivePreset(null);

      // Reset success banner after 2 seconds
      setTimeout(() => setScanComplete(false), 2000);
    }, 1800);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && !isScanning) {
      setIsScanning(true);
      setScanComplete(false);
      
      // Simulate file upload and Gemini multimodal parsing
      setTimeout(() => {
        // Mock extract a random transaction
        onScanSuccess({
          amount: Math.round((Math.random() * 120 + 10) * 100) / 100,
          category: 'Food',
          note: 'Restaurant Invoice',
          currency: 'USD'
        });
        setIsScanning(false);
        setScanComplete(true);
        setTimeout(() => setScanComplete(false), 2000);
      }, 2000);
    }
  };

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-5 relative overflow-hidden">
      
      {/* Laser Sweep Line Overlay */}
      {isScanning && (
        <div className="absolute inset-0 bg-black/60 z-30 flex flex-col items-center justify-center">
          <div className="w-[85%] h-[2px] bg-primary shadow-[0_0_12px_#39FF14] absolute left-[7.5%] animate-laser" />
          <Sparkles className="text-primary animate-pulse mb-2" size={24} />
          <span className="text-xs text-primary font-bold tracking-widest uppercase">Mahi AI OCR Scanning...</span>
          <span className="text-text-muted text-[10px] mt-1">Parsing image variables</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-secondary" size={16} />
          <h4 className="text-white text-xs font-bold uppercase tracking-wider">AI Receipt OCR Scanner</h4>
        </div>
        {scanComplete && (
          <span className="text-primary text-[10px] font-bold uppercase flex items-center gap-1">
            <Check size={10} /> Scan Success
          </span>
        )}
      </div>

      {/* Dropzone Area */}
      <label className="border-2 border-dashed border-white/10 hover:border-secondary/30 rounded-xl py-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 mb-4 bg-black/20 group">
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileChange}
          disabled={isScanning}
        />
        <Upload className="text-text-muted group-hover:text-secondary transition-colors duration-200 mb-2" size={24} />
        <span className="text-white text-xs font-semibold">Upload Invoice Image</span>
        <span className="text-text-muted text-[10px] mt-1">Supports PNG, JPG (Gemini 2.5 Multi-modal)</span>
      </label>

      {/* Presets List */}
      <div>
        <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider mb-2">Test Presets</p>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(PRESETS).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleScanPreset(key as keyof typeof PRESETS)}
              disabled={isScanning}
              className={`py-2 px-2 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                activePreset === key 
                  ? 'bg-secondary/20 border-secondary text-white' 
                  : 'bg-white/3 border-white/5 hover:border-white/15 text-text-muted hover:text-white'
              }`}
            >
              <Camera className="mx-auto mb-1 opacity-70" size={14} />
              <span className="text-[10px] font-bold block truncate">{preset.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default OcrScanner;
