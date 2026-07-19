import React from 'react';
import { cn } from '@/lib/utils';
import { GlassCard } from './GlassCard';

interface BentoItemProps extends React.ComponentPropsWithoutRef<typeof GlassCard> {
  colSpan?: 1 | 2 | 3 | 'full';
  rowSpan?: 1 | 2;
}

export const BentoItem = React.forwardRef<HTMLDivElement, BentoItemProps>(
  ({ className, colSpan = 1, rowSpan = 1, ...props }, ref) => {
    return (
      <GlassCard
        ref={ref}
        className={cn(
          {
            'md:col-span-1': colSpan === 1,
            'md:col-span-2': colSpan === 2,
            'md:col-span-3': colSpan === 3,
            'col-span-full': colSpan === 'full',
            'row-span-1': rowSpan === 1,
            'row-span-2': rowSpan === 2,
          },
          className
        )}
        {...props}
      />
    );
  }
);

BentoItem.displayName = "BentoItem";
