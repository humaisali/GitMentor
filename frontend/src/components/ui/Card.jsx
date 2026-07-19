export const Card = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`bg-muted-surface border border-whisper rounded-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
