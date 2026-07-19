export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div 
      className={`animate-pulse bg-whisper-border rounded-md ${className}`} 
      {...props} 
    />
  );
};
