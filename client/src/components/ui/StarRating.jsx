import React, { useState } from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ value, onChange, readOnly = false }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((index) => {
        const isActive = index <= (hover || value);
        return (
          <button
            key={index}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(index)}
            onMouseEnter={() => !readOnly && setHover(index)}
            onMouseLeave={() => !readOnly && setHover(0)}
            className={`transition-colors focus:outline-none ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          >
            <Star
              className={`h-5 w-5 ${isActive ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
