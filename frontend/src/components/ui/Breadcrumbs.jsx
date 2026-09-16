import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumbs({ items }) {
  return (
    <nav className="flex items-center gap-1.5 text-[13px] text-ink-subtle">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={item.label} className="flex items-center gap-1.5">
            {item.to && !isLast ? (
              <Link to={item.to} className="transition-colors hover:text-ink">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'font-medium text-ink' : ''}>{item.label}</span>
            )}
            {!isLast && <ChevronRight className="size-3.5" />}
          </span>
        );
      })}
    </nav>
  );
}
