export const Card = ({ children, className = '', hover = true, ...props }) => {
  return (
    <div 
      className={`glass-card ${hover ? 'hover:shadow-elevation-3 hover:border-[rgba(88,166,255,0.15)]' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
