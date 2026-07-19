import { forwardRef } from 'react';

export const Input = forwardRef(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-medium text-canvas-white">{label}</label>}
      <input
        ref={ref}
        className={`bg-charcoal-base border border-whisper rounded-md px-3 py-2 text-sm text-canvas-white placeholder:text-muted-steel/50 focus:outline-none focus:border-muted-cyan transition-colors ${error ? 'border-red-500/50 focus:border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-400 font-mono mt-0.5">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
