
import { useState } from 'react';
import { Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoastRatingInputProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  disabled?: boolean;
}

export const RoastRatingInput = ({ rating, onRatingChange, disabled = false }: RoastRatingInputProps) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (newRating: number) => {
    if (!disabled) {
      // If the user clicks the same rating, toggle it off (set to 0)
      // Otherwise, set the new rating
      const finalRating = newRating === rating ? 0 : newRating;
      onRatingChange(finalRating);
    }
  };

  const handleMouseEnter = (newHoverRating: number) => {
    if (!disabled) {
      setHoverRating(newHoverRating);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoverRating(0);
    }
  };

  return (
    <div className="flex gap-1" dir="rtl" role="radiogroup">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoverRating || rating);
        return (
          <div
            key={star}
            role="radio"
            aria-checked={star <= rating}
            aria-label={`דרגת קלייה ${star} מתוך 5`}
            tabIndex={disabled ? -1 : 0}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(star)}
            onKeyDown={(e) => {
              if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
                e.preventDefault();
                handleClick(star);
              }
            }}
            className={cn(
              'cursor-pointer transition-colors',
              {
                'text-[#C67C4E]': isFilled,
                'text-gray-400': !isFilled,
                'hover:text-[#E6D2B5]': !disabled,
                'cursor-not-allowed opacity-50': disabled,
              }
            )}
          >
            <Coffee className="h-6 w-6" fill={isFilled ? 'currentColor' : 'none'} />
          </div>
        );
      })}
    </div>
  );
};
