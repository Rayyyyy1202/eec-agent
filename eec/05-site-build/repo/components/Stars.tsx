type StarsProps = {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
};

const sizeClass = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl'
};

export default function Stars({ rating, size = 'md', showNumber = false }: StarsProps) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <span
      className={`inline-flex items-center gap-1 text-brand-accent ${sizeClass[size]}`}
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      <span aria-hidden="true">
        {'★'.repeat(full)}
        {half ? '½' : ''}
        {'☆'.repeat(empty)}
      </span>
      {showNumber && (
        <span className="text-brand-neutral-1 text-xs font-medium">{rating.toFixed(1)}</span>
      )}
    </span>
  );
}
