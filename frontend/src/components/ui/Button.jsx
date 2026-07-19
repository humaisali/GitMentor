export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md text-sm transition-colors active-press px-4 py-2 cursor-pointer';
  
  const variants = {
    primary: 'bg-muted-cyan text-canvas-white hover:bg-muted-cyan/90',
    secondary: 'bg-transparent border border-whisper text-canvas-white hover:bg-charcoal-base',
    ghost: 'bg-transparent text-muted-steel hover:text-canvas-white hover:bg-charcoal-base'
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
