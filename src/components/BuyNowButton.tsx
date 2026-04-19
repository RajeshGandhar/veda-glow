import type { MouseEventHandler, ReactNode } from "react";

const primary =
  "inline-flex min-h-[56px] w-full max-w-[min(100%,22rem)] shrink-0 items-center justify-center rounded-full bg-veda-green px-8 py-3 text-[1.05rem] font-semibold text-white shadow-[0_16px_40px_-28px_rgba(47,93,80,0.45)] transition-[box-shadow,filter,background-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-30px_rgba(47,93,80,0.36)] hover:bg-[#2a5247] hover:brightness-[1.01] active:brightness-[0.98] active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-veda-green sm:w-auto sm:min-w-[19rem]";

const onDark =
  "inline-flex min-h-[56px] w-full max-w-[min(100%,22rem)] shrink-0 items-center justify-center rounded-full bg-white px-8 py-3 text-[1.05rem] font-semibold text-veda-green shadow-[0_16px_40px_-28px_rgba(15,23,42,0.18)] transition-[box-shadow,background-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#f8f5f2] hover:shadow-[0_22px_50px_-30px_rgba(15,23,42,0.18)] active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto sm:min-w-[19rem]";

const header =
  "inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-full bg-veda-green px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_-22px_rgba(47,93,80,0.45)] transition-[filter,box-shadow,background-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#2a5247] active:brightness-[0.95] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-veda-green";

type BuyProps = {
  variant?: "primary" | "onDark";
  /** Compact header nav style */
  size?: "default" | "header";
  href?: string;
  className?: string;
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
};

export function BuyNowButton({
  variant = "primary",
  size = "default",
  className = "",
  children = "Buy Now @ ₹299",
  href = "#cta",
  onClick,
  disabled,
}: BuyProps) {
  const cls =
    size === "header" ? header : variant === "onDark" ? onDark : primary;

  if (onClick) {
    return (
      <button
        type="button"
        className={`${cls} ${className}`.trim()}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
    );
  }

  return (
    <a href={href} className={`${cls} ${className}`.trim()}>
      {children}
    </a>
  );
}

/** Centered CTA block after section content — consistent spacing */
type SectionCtaProps = {
  onAddToCart?: () => void;
};

export function SectionCta({ onAddToCart }: SectionCtaProps) {
  return (
    <div className="mt-10 flex w-full flex-col items-center gap-1 px-2 sm:mt-14 md:mt-16">
      <BuyNowButton onClick={() => onAddToCart?.()}>Add to Cart</BuyNowButton>
    </div>
  );
}
