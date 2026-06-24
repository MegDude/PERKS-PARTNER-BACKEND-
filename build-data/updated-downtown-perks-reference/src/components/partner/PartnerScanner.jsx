import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanLine, Camera, CameraOff, CheckCircle2, AlertCircle,
  Loader2, X, Keyboard, RotateCcw, User, Coffee
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PartnerScanner({ userPartner }) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null); // { success, perk_name, resident_name } | { error }
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [cameraSupported, setCameraSupported] = useState(true);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const queryClient = useQueryClient();

  // Check if BarcodeDetector is available
  useEffect(() => {
    if (!('BarcodeDetector' in window)) {
      setCameraSupported(false);
      setManualMode(true);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
  }, []);

  const verifyRedemption = useCallback(async (qrData) => {
    setVerifying(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('verifyRedemption', { qr_data: qrData });
      const data = res.data || res;
      if (data.success) {
        setResult({
          success: true,
          perk_name: data.perk_name,
          resident_name: data.resident_name,
          redemption: data.redemption,
        });
        queryClient.invalidateQueries({ queryKey: ['partner_context'] });
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Verification failed';
      setError(msg);
    } finally {
      setVerifying(false);
    }
  }, [queryClient]);

  const startCamera = useCallback(async () => {
    setError(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] });
      setScanning(true);

      const detect = async () => {
        if (!scanning || !videoRef.current || !detectorRef.current) return;
        try {
          const codes = await detectorRef.current.detect(videoRef.current);
          if (codes.length > 0) {
            const qrData = codes[0].rawValue;
            stopCamera();
            await verifyRedemption(qrData);
            return;
          }
        } catch (e) {
          // detection error, continue
        }
        rafRef.current = requestAnimationFrame(detect);
      };
      rafRef.current = requestAnimationFrame(detect);
    } catch (err) {
      setError('Unable to access camera. Use manual entry instead.');
      setManualMode(true);
      setCameraSupported(false);
    }
  }, [scanning, stopCamera, verifyRedemption]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleManualVerify = async () => {
    if (!manualCode.trim()) return;
    await verifyRedemption(manualCode.trim());
    setManualCode('');
  };

  const reset = () => {
    setResult(null);
    setError(null);
    if (cameraSupported && !manualMode) {
      startCamera();
    }
  };

  const switchToManual = () => {
    stopCamera();
    setManualMode(true);
    setResult(null);
    setError(null);
  };

  const switchToCamera = () => {
    setManualMode(false);
    setResult(null);
    setError(null);
    startCamera();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-navy text-lg flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-gold" />
            Quick Scanner
          </h2>
          <p className="text-sm text-textMuted mt-0.5">
            Scan a resident's perk QR code to verify and record redemptions instantly.
          </p>
        </div>
        {/* Mode toggle */}
        <div className="flex bg-bgAlt rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => cameraSupported && switchToCamera()}
            disabled={!cameraSupported}
            className={cn(
              'p-2 rounded-md transition-colors',
              !manualMode ? 'bg-white shadow-xs text-navy' : 'text-textMuted',
              !cameraSupported && 'opacity-40 cursor-not-allowed'
            )}
            title="Camera scan"
          >
            <Camera className="w-4 h-4" />
          </button>
          <button
            onClick={switchToManual}
            className={cn(
              'p-2 rounded-md transition-colors',
              manualMode ? 'bg-white shadow-xs text-navy' : 'text-textMuted'
            )}
            title="Manual entry"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Result display */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border-2 p-6 flex flex-col items-center text-center"
            style={{ borderColor: 'var(--color-emerald-200, #a7f3d0)', background: 'var(--color-emerald-50, #ecfdf5)' }}
          >
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="font-bold text-navy text-lg">Redemption Verified</h3>
            <p className="text-sm text-textSecondary mt-1">
              <span className="font-semibold text-navy">{result.resident_name}</span> redeemed
            </p>
            <p className="text-sm font-semibold text-gold mt-0.5">{result.perk_name}</p>
            <button
              onClick={reset}
              className="mt-5 flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-navySoft transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Scan Next
            </button>
          </motion.div>
        )}

        {error && !result && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border-2 border-red-200 bg-red-50 p-6 flex flex-col items-center text-center"
          >
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-3">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="font-bold text-navy text-lg">Verification Failed</h3>
            <p className="text-sm text-textSecondary mt-1">{error}</p>
            <button
              onClick={reset}
              className="mt-5 flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-navySoft transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanner / Manual entry */}
      {!result && !error && (
        <>
          {/* Camera scanner mode */}
          {!manualMode && (
            <div className="rounded-2xl bg-navy p-6 overflow-hidden">
              {!scanning ? (
                <div className="flex flex-col items-center text-center py-8">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-white font-semibold mb-1">Ready to Scan</h3>
                  <p className="text-white/50 text-sm mb-5 max-w-xs">
                    Tap below to open your camera and scan a resident's perk QR code.
                  </p>
                  <button
                    onClick={startCamera}
                    className="flex items-center gap-2 bg-gold text-navy px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gold-soft transition-colors shadow-gold"
                  >
                    <Camera className="w-4 h-4" />
                    Start Scanning
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-square max-w-xs mx-auto">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Scan overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-56 h-56 border-2 border-gold rounded-2xl relative">
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-gold rounded-tl-lg" />
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-gold rounded-tr-lg" />
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-gold rounded-bl-lg" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-gold rounded-br-lg" />
                        {/* Scanning line */}
                        <motion.div
                          className="absolute left-2 right-2 h-0.5 bg-gold rounded-full shadow-[0_0_8px_rgba(201,162,39,0.8)]"
                          animate={{ top: ['10%', '90%', '10%'] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      </div>
                    </div>
                    {verifying && (
                      <div className="absolute inset-0 bg-navy/80 flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 text-gold animate-spin mb-2" />
                        <p className="text-white text-sm font-medium">Verifying…</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-white/50 text-xs">Point camera at QR code</p>
                    <button
                      onClick={stopCamera}
                      className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors"
                    >
                      <X className="w-4 h-4" /> Stop
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual entry mode */}
          {manualMode && (
            <div className="rounded-2xl bg-white border border-[var(--border-subtle)] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Keyboard className="w-5 h-5 text-gold" />
                <h3 className="font-semibold text-navy text-sm">Manual Code Entry</h3>
              </div>
              <p className="text-sm text-textMuted mb-4">
                Paste the QR code data or enter the redemption code manually.
              </p>
              <textarea
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                placeholder='Paste QR data here (e.g. {"type":"dp_redeem","perk_id":"…","user_email":"…"})'
                rows={4}
                className="w-full rounded-xl border border-[var(--border-default)] px-3 py-2 text-sm font-mono resize-none focus:border-gold focus:ring-2 focus:ring-gold/12 outline-none transition-all"
              />
              <button
                onClick={handleManualVerify}
                disabled={!manualCode.trim() || verifying}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-navy text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-navySoft transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Verify Redemption</>
                )}
              </button>
              {cameraSupported && (
                <button
                  onClick={switchToCamera}
                  className="w-full mt-2 flex items-center justify-center gap-2 text-textMuted hover:text-navy text-sm py-2 transition-colors"
                >
                  <Camera className="w-4 h-4" /> Use Camera Instead
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Info card */}
      <div className="flex items-start gap-3 p-4 bg-bgAlt rounded-xl">
        <div className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center shrink-0">
          <Coffee className="w-4 h-4 text-gold" />
        </div>
        <div>
          <p className="text-xs font-semibold text-navy">How it works</p>
          <p className="text-xs text-textMuted mt-0.5 leading-relaxed">
            Residents show their perk QR code at your venue. Scan it to instantly verify eligibility and record the redemption. Duplicates are blocked for 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}