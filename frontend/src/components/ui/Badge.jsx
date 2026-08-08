export const Badge = ({ children, variant = 'default', className = '', ...props }) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono border whitespace-nowrap backdrop-blur-sm transition-all duration-200';
  
  const variants = {
    default: 'bg-white/[0.04] border-white/[0.08] text-muted-steel',
    primary: 'bg-muted-cyan/10 border-muted-cyan/20 text-muted-cyan shadow-[inset_0_1px_0_rgba(88,166,255,0.1)]',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[inset_0_1px_0_rgba(16,185,129,0.1)]',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[inset_0_1px_0_rgba(245,158,11,0.1)]',
    error: 'bg-red-500/10 border-red-500/20 text-red-400 shadow-[inset_0_1px_0_rgba(239,68,68,0.1)]',
    outline: 'bg-transparent border-white/[0.1] text-muted-steel',
  };

  return (
    <span 
      className={`${baseStyles} ${variants[variant] || variants.default} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
