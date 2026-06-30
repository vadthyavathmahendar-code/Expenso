import React, { useState } from 'react';
import { Camera, Sparkles, Upload, Check, Trash2, Save } from 'lucide-react';
import type { CurrencyCode } from '../services/currency';

interface OcrScannerProps {
  onScanSuccess: (data: {
    amount: number;
    category: string;
    note: string;
    currency: CurrencyCode;
    merchant?: string;
  }) => void;
}

interface ScannedResult {
  amount: number;
  category: string;
  note: string;
  currency: CurrencyCode;
  merchant: string;
  confidence: string;
  scanTime: string;
  previewUrl?: string;
}

const PRESETS = {
  uber: {
    name: 'Uber Black Receipt',
    amount: 45.00,
    category: 'Transport',
    note: 'Uber Black Ride',
    currency: 'USD' as CurrencyCode,
    confidence: '98%',
    scanTime: '1.2s'
  },
  starbucks: {
    name: 'Starbucks Coffee',
    amount: 12.80,
    category: 'Food',
    note: 'Starbucks Coffee & Pastry',
    currency: 'USD' as CurrencyCode,
    confidence: '96%',
    scanTime: '0.9s'
  },
  aws: {
    name: 'AWS Cloud Invoice',
    amount: 145.20,
    category: 'Bills',
    note: 'AWS Cloud Hosting',
    currency: 'EUR' as CurrencyCode,
    confidence: '99%',
    scanTime: '1.5s'
  }
};

export const OcrScanner: React.FC<OcrScannerProps> = ({ onScanSuccess }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<ScannedResult | null>(null);

  const handleScanPreset = (key: keyof typeof PRESETS) => {
    if (isScanning) return;
    
    setIsScanning(true);
    setScanComplete(false);
    setScannedResult(null);
    setActivePreset(key);

    const preset = PRESETS[key];

    // Simulate OCR scanning latency (laser sweeping)
    setTimeout(() => {
      setScannedResult({
        amount: preset.amount,
        category: preset.category,
        note: preset.note,
        currency: preset.currency,
        merchant: preset.name,
        confidence: preset.confidence,
        scanTime: preset.scanTime,
        previewUrl: 'preset'
      });
      setIsScanning(false);
      setScanComplete(true);
      setActivePreset(null);
    }, 1200);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && !isScanning) {
      setIsScanning(true);
      setScanComplete(false);
      setScannedResult(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        
        // Simulate file upload and Gemini multimodal parsing
        setTimeout(() => {
          setScannedResult({
            amount: Math.round((Math.random() * 120 + 15) * 100) / 100,
            category: 'Food',
            note: 'Restaurant Invoice',
            currency: 'INR',
            merchant: 'Grand Bistro Cafe',
            confidence: '94%',
            scanTime: '1.7s',
            previewUrl: dataUrl
          });
          setIsScanning(false);
          setScanComplete(true);
        }, 1500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveToLedger = () => {
    if (scannedResult) {
      onScanSuccess({
        amount: scannedResult.amount,
        category: scannedResult.category,
        note: scannedResult.note,
        currency: scannedResult.currency,
        merchant: scannedResult.merchant
      });
      setScannedResult(null);
      setScanComplete(false);
    }
  };

  const handleDiscard = () => {
    setScannedResult(null);
    setScanComplete(false);
  };

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-5 relative overflow-hidden flex flex-col gap-4">
      
      {/* Laser Sweep Line Overlay */}
      {isScanning && (
        <div className="absolute inset-0 bg-black/60 z-30 flex flex-col items-center justify-center">
          <div className="w-[85%] h-[2px] bg-primary shadow-[0_0_12px_#39FF14] absolute left-[7.5%] animate-laser" />
          <Sparkles className="text-primary animate-pulse mb-2" size={24} />
          <span className="text-xs text-primary font-bold tracking-widest uppercase font-sans">Mahi AI OCR Scanning...</span>
          <span className="text-text-muted text-[10px] mt-1 font-sans">Parsing image variables</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="text-secondary" size={16} />
          <h4 className="text-white text-xs font-bold uppercase tracking-wider font-sans">AI Receipt OCR Scanner</h4>
        </div>
        {scanComplete && (
          <span className="text-primary text-[10px] font-bold uppercase flex items-center gap-1 font-sans">
            <Check size={10} /> Scan Success
          </span>
        )}
      </div>

      {/* Scanned Result Review Card */}
      {scannedResult ? (
        <div className="bg-black/30 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
          <span className="text-text-muted text-[8px] font-bold uppercase tracking-wider block font-sans">Review Scan Results</span>
          
          <div className="flex gap-3">
            {/* Last Scanned Receipt Preview */}
            <div className="w-16 h-16 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
              {scannedResult.previewUrl && scannedResult.previewUrl !== 'preset' ? (
                <img src={scannedResult.previewUrl} alt="Receipt Thumbnail" className="w-full h-full object-cover" />
              ) : (
                <Camera className="text-text-muted opacity-60" size={24} />
              )}
            </div>
            
            <div className="flex-1 min-w-0 space-y-1 text-[10px] font-sans">
              <div className="flex justify-between">
                <span className="text-text-muted font-bold">Merchant:</span>
                <span className="text-white font-bold truncate max-w-[150px]">{scannedResult.merchant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted font-bold">Amount:</span>
                <span className="text-white font-bold">{scannedResult.currency === 'INR' ? '₹' : '$'}{scannedResult.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted font-bold">Category:</span>
                <span className="text-white font-bold">{scannedResult.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted font-bold">Confidence:</span>
                <span className="text-primary font-bold">{scannedResult.confidence}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted font-bold">Scan Time:</span>
                <span className="text-secondary font-bold">{scannedResult.scanTime}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={handleDiscard}
              className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] border border-white/8 flex items-center justify-center gap-1.5 cursor-pointer font-sans"
            >
              <Trash2 size={12} />
              <span>Discard</span>
            </button>
            <button
              type="button"
              onClick={handleSaveToLedger}
              className="flex-1 py-2 rounded-xl bg-gradient-to-tr from-primary to-secondary text-black font-black text-[10px] flex items-center justify-center gap-1.5 shadow-lg shadow-primary/10 cursor-pointer font-sans"
            >
              <Save size={12} />
              <span>Save to Ledger</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Dropzone Area */}
          <label className="border-2 border-dashed border-white/10 hover:border-secondary/30 rounded-xl py-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 bg-black/20 group">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange}
              disabled={isScanning}
            />
            <Upload className="text-text-muted group-hover:text-secondary transition-colors duration-200 mb-2" size={24} />
            <span className="text-white text-xs font-semibold font-sans">Upload Invoice Image</span>
            <span className="text-text-muted text-[10px] mt-1 font-sans">Supports PNG, JPG (Gemini 2.5 Multi-modal)</span>
          </label>

          {/* Presets List */}
          <div>
            <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider mb-2 font-sans">Test Presets</p>
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
                  <span className="text-[10px] font-bold block truncate font-sans">{preset.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default OcrScanner;
