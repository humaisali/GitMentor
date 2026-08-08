export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div 
      className={`rounded-2xl bg-white/[0.04] animate-shimmer ${className}`} 
      {...props} 
    />
  );
};
