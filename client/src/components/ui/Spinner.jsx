import React from 'react';
import { Loader2 } from 'lucide-react';

const Spinner = ({ className = '', size = 24 }) => {
  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <Loader2 size={size} className="animate-spin text-primary" />
    </div>
  );
};

export default Spinner;
