import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { QrCode, Download, Loader2, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PerkQRCode({ perk }) {
  const [user, setUser] = useState(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  if (!user) return null;

  const payload = JSON.stringify({
    type: 'dp_redeem',
    perk_id: perk.id,
    perk_name: perk.name,
    user_email: user.email,
    user_name: user.full_name,
  });

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&bgcolor=FFFFFF&color=0B1F33&data=${encodeURIComponent(payload)}`;

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `perk-${perk.name?.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
    link.target = '_blank';
    link.click();
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setShowQR(true)}
        className="w-full flex items-center justify-center gap-2 bg-navy text-white py-3 rounded-xl font-semibold text-sm hover:bg-navySoft transition-colors active:scale-[0.98]"
      >
        <QrCode className="w-5 h-5" />
        Show My Perk QR Code
      </button>

      {/* QR Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm"
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <h3 className="font-bold text-navy text-sm">Resident Perk Pass</h3>
                </div>
                <button onClick={() => setShowQR(false)} className="p-1.5 hover:bg-bgAlt rounded-lg transition-colors">
                  <X className="w-4 h-4 text-textMuted" />
                </button>
              </div>

              {/* QR content */}
              <div className="p-6 flex flex-col items-center text-center">
                <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-1">{perk.category}</p>
                <h4 className="font-bold text-navy text-lg mb-1">{perk.name}</h4>
                {perk.perk && (
                  <p className="text-sm text-textSecondary mb-4 leading-relaxed">{perk.perk}</p>
                )}

                <div className="p-4 bg-white rounded-2xl border-2 border-[var(--border-default)] shadow-sm mb-4">
                  <img
                    src={qrUrl}
                    alt="Perk QR Code"
                    className="w-[240px] h-[240px]"
                  />
                </div>

                <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-gold/8 rounded-lg w-full">
                  <QrCode className="w-3.5 h-3.5 text-gold shrink-0" />
                  <p className="text-xs text-navy font-medium leading-snug text-left">
                    Show this code at {perk.name} to redeem your perk.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full">
                  <button
                    onClick={downloadQR}
                    className="flex-1 flex items-center justify-center gap-2 bg-navy text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-navySoft transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => setShowQR(false)}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-textSecondary border border-[var(--border-default)] hover:bg-bgAlt transition-colors"
                  >
                    Close
                  </button>
                </div>

                <p className="text-[10px] text-textMuted mt-4 leading-relaxed">
                  Resident: {user.full_name} · {user.email}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}