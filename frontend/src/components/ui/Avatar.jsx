import { cn } from '../../lib/cn';

function initials(name = '') {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const sizes = {
  sm: 'size-8 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-20 text-xl',
};

export default function Avatar({ name, src, size = 'md', className }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover ring-1 ring-border', sizes[size], className)}
      />
    );
  }
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-white',
        sizes[size],
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
