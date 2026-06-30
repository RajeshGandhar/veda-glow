import { useEffect, useMemo, useState } from "react";
import kitImgAvif from "../assets/hero-premium.avif";
import kitImgWebp from "../assets/hero-premium.webp";
import { getPriceByQty } from "../utils/pricing";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type Props = {
  cartItems: CartItem[];
  cartTotal: number;
  onClose: () => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  onAddProduct?: () => void;
};

export function CartPanel({
  cartItems,
  cartTotal,
  onClose,
  onRemove,
  onCheckout,
  onAddProduct,
}: Props) {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const { body, documentElement } = document;
    const scrollY = window.scrollY;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyWidth = body.style.width;
    const previousBodyLeft = body.style.left;
    const previousBodyRight = body.style.right;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousHtmlOverscrollBehavior =
      documentElement.style.overscrollBehavior;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.left = "0";
    body.style.right = "0";
    documentElement.style.overflow = "hidden";
    documentElement.style.overscrollBehavior = "none";

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.width = previousBodyWidth;
      body.style.left = previousBodyLeft;
      body.style.right = previousBodyRight;
      documentElement.style.overflow = previousHtmlOverflow;
      documentElement.style.overscrollBehavior = previousHtmlOverscrollBehavior;
      window.scrollTo(0, scrollY);
    };
  }, []);

  const itemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );
  const pricingSummary = useMemo(
    () =>
      cartItems.reduce(
        (acc, item) => {
          const p = getPriceByQty(item.quantity);
          acc.original += p.original;
          acc.discounted += p.discounted;
          acc.savings += p.savings;
          return acc;
        },
        { original: 0, discounted: 0, savings: 0 },
      ),
    [cartItems],
  );
  const deliveryCharge = 0;
  const totalWithDelivery = cartTotal;

  const closePanel = () => {
    setIsOpen(false);
    setTimeout(onClose, 220);
  };

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closePanel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex overscroll-none bg-[radial-gradient(circle_at_top_left,rgba(248,242,229,0.25)_0%,rgba(7,18,14,0.74)_55%,rgba(2,6,23,0.9)_100%)] backdrop-blur-md transition-opacity duration-300"
      style={{
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? "auto" : "none",
      }}
      onClick={handleClickOutside}
    >
      <aside
        aria-label="Shopping cart"
        className="ml-auto flex h-[100dvh] w-full max-w-full flex-col overflow-hidden border-l border-[#dcccad] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(246,238,223,0.96)_100%)] shadow-[0_36px_110px_-48px_rgba(3,7,18,0.88)] backdrop-blur-xl transition-transform duration-300 ease-out sm:max-w-[27rem]"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(104%)" }}
      >
        <header className="border-b border-[#dcccad] bg-[linear-gradient(130deg,#fffefb_0%,#f7efdf_54%,#eef6f1_100%)] px-3.5 py-3 sm:px-4 sm:py-4">
          <div className="rounded-xl border border-[#dcccad] bg-white/75 px-3 py-2.5 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.68)] sm:px-4 sm:py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-[#76603c]">
                  Your cart
                </p>
                <h3 className="mt-1 font-serif text-[1.2rem] leading-none text-[#0e3a2d] sm:text-[1.35rem]">
                  VedaGlow Cart
                </h3>
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#d5c39b] bg-[linear-gradient(180deg,#fffdfa_0%,#f2eadc_100%)] text-[0.68rem] font-semibold text-[#5e4a2b] shadow-[0_14px_26px_-22px_rgba(15,23,42,0.82)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_34px_-24px_rgba(15,23,42,0.88)] sm:h-8 sm:w-8 sm:text-sm"
                aria-label="Close cart"
              >
                ✕
              </button>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.66rem] font-medium text-neutral-700 sm:text-[0.7rem]">
              <span>
                {itemCount} item{itemCount === 1 ? "" : "s"} selected
              </span>
              <span
                className="h-1 w-1 rounded-full bg-[#b79a6a]"
                aria-hidden="true"
              />
              <span>Curated essentials with secure premium checkout</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-y-contain px-3.5 py-4 [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch] sm:px-5 sm:py-6">
          {!cartItems.length ? (
            <div className="mt-3 rounded-[1.35rem] border border-[#e4d9c5] bg-[linear-gradient(160deg,#fffefb_0%,#f6efdf_100%)] p-4 shadow-[0_28px_60px_-44px_rgba(15,23,42,0.5)] sm:mt-6 sm:rounded-[1.6rem] sm:p-5">
              <div className="text-center">
                <p className="inline-flex rounded-full border border-[#d9c7a0] bg-[#f8f1e2] px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#5f4a2c]">
                  Starter ritual
                </p>
                <p className="mt-3 font-serif text-[1.34rem] leading-tight text-[#173229] sm:text-[1.55rem]">
                  Your premium cart is waiting
                </p>
                <p className="mt-2 text-[0.82rem] text-neutral-600 sm:text-sm">
                  Add the 28-day kit to unlock checkout and begin your routine.
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-[#e6dbc9] bg-white/70 px-4 py-3 text-center">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  Starter Price
                </p>
                <p className="mt-1 font-serif text-2xl leading-none text-[#123f33]">
                  Rs 499
                </p>
              </div>

              <button
                type="button"
                onClick={onAddProduct}
                disabled={!onAddProduct}
                className="mt-4 w-full rounded-xl bg-[linear-gradient(120deg,#144535_0%,#205443_100%)] px-4 py-3 text-[0.82rem] font-semibold text-white shadow-[0_22px_44px_-26px_rgba(20,69,53,0.7)] transition-all hover:-translate-y-0.5 hover:bg-[linear-gradient(120deg,#103d2f_0%,#1a4a3b_100%)] disabled:cursor-not-allowed disabled:opacity-60 sm:py-3.5 sm:text-sm"
              >
                Add VedaGlow Kit to Cart
              </button>
              <p className="mt-3 text-center text-xs font-medium text-neutral-500">
                Secure checkout · COD available · Fast dispatch
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {cartItems.map((item) => {
                const itemPricing = getPriceByQty(item.quantity);
                return (
                  <article
                    key={item.id}
                    className="rounded-xl border border-[#d9cbb3] bg-[linear-gradient(180deg,#ffffff_0%,#f8f0e2_100%)] p-3.5 shadow-[0_22px_46px_-34px_rgba(15,23,42,0.46)] sm:rounded-2xl sm:p-4"
                  >
                    <div className="flex gap-3 sm:gap-4">
                      <picture>
                        <source srcSet={kitImgAvif} type="image/avif" />
                        <source srcSet={kitImgWebp} type="image/webp" />
                        <img
                          src={kitImgWebp}
                          alt={item.name}
                          className="h-[4.75rem] w-[4.75rem] shrink-0 rounded-lg border border-[#d8ccb4] bg-[#f8fbf8] object-cover shadow-[0_16px_30px_-22px_rgba(15,23,42,0.55)] sm:h-[5.5rem] sm:w-[5.5rem] sm:rounded-xl"
                          width={76}
                          height={76}
                          loading="lazy"
                          decoding="async"
                        />
                      </picture>

                      <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[0.9rem] font-semibold leading-tight text-[#183328] sm:text-[0.98rem]">
                              {item.name}
                            </p>
                            <p className="mt-1 text-[0.68rem] text-neutral-500 sm:text-xs">
                              Unit price Rs {item.price}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="rounded-full border border-[#dfc9c4] bg-[#fff8f5] px-2.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-[#8e544d] transition-colors hover:border-[#cfa9a2] hover:bg-[#f8eae7] hover:text-[#713934] sm:px-3 sm:py-1 sm:text-[0.67rem]"
                            onClick={() => onRemove(item.id)}
                          >
                            Remove
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2"></div>

                        <div className="border-t border-[#eadfca] pt-2.5 sm:pt-3">
                          <div className="flex items-center gap-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#d0dccf] bg-[#f8fbf8] px-3 py-1 text-[#23443a] shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]">
                              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] sm:text-[0.76rem]">
                                Quantity
                              </span>
                              <span className="rounded-full bg-white px-2 py-0.5 text-[0.72rem] font-bold">
                                1
                              </span>
                            </div>

                            <div className="ml-auto min-w-[5rem] text-right">
                              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-neutral-500 sm:text-[0.7rem]">
                                Line total
                              </p>
                              <p className="mt-0.5 text-base font-bold text-[#173229] sm:text-lg">
                                Rs {itemPricing.discounted}
                              </p>
                              {itemPricing.savings > 0 && (
                                <p className="text-[0.68rem] text-neutral-400 line-through sm:text-xs">
                                  Rs {itemPricing.original}
                                </p>
                              )}
                            </div>
                          </div>
                          <p className="mt-1.5 text-[0.62rem] font-medium text-neutral-500 sm:text-[0.68rem]">
                            Standard kit pack
                          </p>
                        </div>
                      </div>
                    </div>

                    {itemPricing.savings > 0 && (
                      <p className="mt-2.5 border-t border-[#eadfca] pt-2.5 text-[0.7rem] font-semibold text-emerald-700 sm:mt-3 sm:pt-3 sm:text-xs">
                        You save Rs {itemPricing.savings} on this item
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {!!cartItems.length && (
          <footer className="sticky bottom-0 border-t border-[#dcccad] bg-[linear-gradient(180deg,#fffdf8_0%,#f7efdf_100%)] px-3.5 py-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-5 sm:py-5">
            <div className="rounded-lg border border-[#dcccad] bg-[linear-gradient(180deg,#ffffff_0%,#f8f1e4_100%)] p-2 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.55)] sm:p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[0.74rem] font-semibold text-neutral-700 sm:text-[0.78rem]">
                  Total payable
                </span>
                <span className="text-[1.04rem] font-bold text-veda-green sm:text-[1.12rem]">
                  Rs {totalWithDelivery}
                </span>
              </div>

              <p className="mt-1 text-[0.58rem] font-medium text-neutral-500 sm:text-[0.62rem]">
                {deliveryCharge > 0
                  ? `Includes Rs ${deliveryCharge} delivery`
                  : "Free delivery included"}
              </p>

              {pricingSummary.savings > 0 && (
                <p className="mt-1 text-[0.58rem] font-semibold text-emerald-700 sm:text-[0.62rem]">
                  You saved Rs {pricingSummary.savings} on this order.
                </p>
              )}
            </div>

            <button
              type="button"
              className="mt-2.5 w-full rounded-xl bg-[linear-gradient(118deg,#0f3f33_0%,#1b5a47_62%,#7a5a2f_100%)] px-4 py-3 text-[0.76rem] font-bold tracking-[0.01em] text-white shadow-[0_22px_40px_-24px_rgba(6,95,70,0.72)] transition-all hover:-translate-y-0.5 hover:bg-[linear-gradient(118deg,#0a3027_0%,#154638_62%,#6a4d27_100%)] active:scale-[0.99] sm:mt-3 sm:py-3.5 sm:text-[0.82rem]"
              onClick={onCheckout}
            >
              Proceed to Secure Checkout - Rs {totalWithDelivery}
            </button>

            <p className="mt-2 text-center text-[0.68rem] text-neutral-500 sm:text-xs">
              Encrypted payments and COD available
            </p>
          </footer>
        )}
      </aside>
    </div>
  );
}
