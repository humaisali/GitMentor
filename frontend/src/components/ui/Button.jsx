export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl text-sm transition-all duration-300 active:scale-[0.97] px-4 py-2 cursor-pointer';
  
  const variants = {
    primary: 'bg-gradient-to-r from-muted-cyan to-blue-400 text-bg-deep hover:shadow-[0_0_25px_rgba(88,166,255,0.35)] hover:brightness-110 shadow-[0_0_15px_rgba(88,166,255,0.2)]',
    secondary: 'bg-white/[0.05] backdrop-blur-md border border-white/[0.08] text-canvas-white hover:bg-white/[0.1] hover:border-muted-cyan/30 hover:shadow-[0_0_15px_rgba(88,166,255,0.1)]',
    ghost: 'bg-transparent text-muted-steel hover:text-canvas-white hover:bg-white/[0.06]',
    outline: 'bg-transparent border border-white/[0.08] text-canvas-white hover:bg-white/[0.05] hover:border-muted-cyan/20'
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
