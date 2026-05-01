import React from 'react';

export const Logo = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <img src="/logo.png" alt="Udayam AI Labs" className="h-8 w-auto" />
    <div>
      <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">
        Udayam AI Labs
      </h1>
      <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">
        Land Record Intelligence
      </p>
    </div>
  </div>
);

export const LogoIcon = ({ className = "" }: { className?: string }) => (
  <img src="/logo.png" alt="Udayam AI Labs" className={`h-8 w-auto ${className}`} />
);

export const CreditLine = () => (
  <div className="text-sm">
    <a 
      href="https://udayam.co.in" 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
    >
      Powered by Udayam AI Labs
    </a>
  </div>
);

export const SecureBadge = () => (
  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
    <span className="text-xs font-bold uppercase tracking-wider">Secure AI</span>
  </div>
);