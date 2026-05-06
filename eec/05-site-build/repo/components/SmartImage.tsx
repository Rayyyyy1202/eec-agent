import Image from 'next/image';
import { getAsset, isDelivered, type Asset } from '@/lib/assets';

type Ratio = '1:1' | '4:5' | '16:9' | '9:16';
type Variant = 'navy' | 'orange' | 'cream';

type Props = {
  /** Look up the asset (and its production status) from 04-creative-factory. */
  assetId?: string;
  /** Override alt text. Defaults to the asset's altText, or `label` for ad-hoc placeholders. */
  alt?: string;
  ratio?: Ratio;
  variant?: Variant;
  /** Short visible label on the placeholder (e.g. "angle", "detail"). */
  label?: string;
  className?: string;
  /** Hint to next/image for above-the-fold rendering. */
  priority?: boolean;
  /** next/image `sizes` for responsive layouts. */
  sizes?: string;
};

const aspectClass: Record<Ratio, string> = {
  '1:1': 'aspect-square',
  '4:5': 'aspect-[4/5]',
  '16:9': 'aspect-video',
  '9:16': 'aspect-[9/16]'
};

const variantClass: Record<Variant, string> = {
  navy: 'bg-gradient-to-br from-brand-primary via-brand-neutral-1 to-brand-primary text-brand-secondary',
  orange: 'bg-gradient-to-br from-brand-accent via-orange-400 to-brand-accent text-white',
  cream: 'bg-gradient-to-br from-brand-neutral-3 via-brand-secondary to-brand-neutral-3 text-brand-primary'
};

function PlaceholderBlock({
  alt,
  ratio,
  variant,
  label,
  className,
  briefHint
}: {
  alt: string;
  ratio: Ratio;
  variant: Variant;
  label?: string;
  className: string;
  briefHint?: string;
}) {
  return (
    <div
      role="img"
      aria-label={alt}
      data-asset-status="placeholder"
      className={`${aspectClass[ratio]} ${variantClass[variant]} ${className} relative flex flex-col items-center justify-center overflow-hidden rounded-md`}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)'
        }}
      />
      <div className="relative z-10 px-6 text-center">
        <div className="text-xs uppercase tracking-widest opacity-70 mb-2">Placeholder</div>
        <div className="text-sm font-medium leading-snug">{label || alt}</div>
        {briefHint && (
          <div className="mt-2 text-[10px] uppercase tracking-wider opacity-50">brief: {briefHint}</div>
        )}
      </div>
    </div>
  );
}

export default function SmartImage({
  assetId,
  alt,
  ratio = '16:9',
  variant = 'navy',
  label,
  className = '',
  priority = false,
  sizes
}: Props) {
  const asset: Asset | undefined = assetId ? getAsset(assetId) : undefined;
  const effectiveAlt = alt || asset?.altText || label || 'Image';

  if (asset && isDelivered(asset) && asset.deliveredFilePath && asset.width && asset.height) {
    return (
      <div
        data-asset-id={asset.id}
        data-asset-status={asset.status}
        className={`${aspectClass[ratio]} ${className} relative overflow-hidden rounded-md`}
      >
        <Image
          src={asset.deliveredFilePath}
          alt={effectiveAlt}
          fill
          sizes={sizes || '(min-width: 768px) 50vw, 100vw'}
          priority={priority}
          className="object-cover"
        />
      </div>
    );
  }

  const briefHint = asset?.shootBriefMdPath?.split('/').pop();
  return (
    <PlaceholderBlock
      alt={effectiveAlt}
      ratio={ratio}
      variant={variant}
      label={label}
      className={className}
      briefHint={briefHint}
    />
  );
}
