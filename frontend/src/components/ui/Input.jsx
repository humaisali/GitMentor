import { forwardRef } from 'react';

export const Input = forwardRef(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-medium text-canvas-white">{label}</label>}
      <input
        ref={ref}
        className={`bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-canvas-white placeholder:text-muted-steel/40 focus:outline-none focus:border-muted-cyan/50 focus:shadow-[0_0_20px_rgba(88,166,255,0.15)] focus:bg-white/[0.06] transition-all duration-300 ${error ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.15)]' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-400 font-mono mt-0.5">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
