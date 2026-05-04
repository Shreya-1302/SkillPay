import React from 'react';

const Skeleton = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-secondary/50 rounded-xl ${className}`} />
  );
};

export default Skeleton;
