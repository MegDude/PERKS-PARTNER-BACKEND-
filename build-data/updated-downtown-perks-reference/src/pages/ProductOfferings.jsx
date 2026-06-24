import React from 'react';
import ProductCatalog from '@/components/billing/ProductCatalog';

export default function ProductOfferings() {
  return (
    <div className="min-h-screen bg-bgMain">
      {/* Header */}
      <div className="bg-navy text-white safe-area-top sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-4">
          <a href="/" className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-2">
            ← Home
          </a>
          <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold mb-0.5">Billing</p>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Product Offerings</h1>
          <p className="text-white/50 text-sm mt-0.5">Subscription tiers, add-on modules, and one-time services</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24">
        <ProductCatalog />
      </div>
    </div>
  );
}