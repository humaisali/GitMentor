export const Badge = ({ children, variant = 'default', className = '', ...props }) => {
  const baseStyles = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono border whitespace-nowrap';
  
  const variants = {
    default: 'bg-charcoal-base border-whisper text-muted-steel',
    primary: 'bg-muted-cyan/10 border-muted-cyan/20 text-muted-cyan',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
  };

  return (
    <span 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
