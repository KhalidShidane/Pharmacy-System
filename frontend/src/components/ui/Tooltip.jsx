import { useState } from 'react';
import { cn } from '../../lib/cn';

export default function Tooltip({ label, children, side = 'top', className }) {
  const [visible, setVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && label && (
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] font-medium text-canvas shadow-lg',
            positions[side],
            className
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}
