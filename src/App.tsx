import { lazy, Suspense, useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Problem } from "./components/Problem";
import { Solution } from "./components/Solution";
import { HowItWorks } from "./components/HowItWorks";
import { Testimonials } from "./components/Testimonials";
import { Trust } from "./components/Trust";
import { CTA } from "./components/CTA";
import { OfferBanner } from "./components/OfferBanner";
import { Footer } from "./components/Footer";
import { CartPanel } from "./components/CartPanel";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { NotFoundPage } from "./components/ErrorPages";
const Checkout = lazy(() =>
  import("./components/Checkout").then((m) => ({ default: m.Checkout })),
);
const PrivacyPolicy = lazy(() =>
  import("./components/PrivacyPolicy").then((m) => ({
    default: m.PrivacyPolicy,
  })),
);
const CookiePolicy = lazy(() =>
  import("./components/CookiePolicy").then((m) => ({
    default: m.CookiePolicy,
  })),
);
const TermsAndConditions = lazy(() =>
  import("./components/TermsAndConditions").then((m) => ({
    default: m.TermsAndConditions,
  })),
);
const ReturnRefundPolicy = lazy(() =>
  import("./components/ReturnRefundPolicy").then((m) => ({
    default: m.ReturnRefundPolicy,
  })),
);
const ShippingPolicy = lazy(() =>
  import("./components/ShippingPolicy").then((m) => ({
    default: m.ShippingPolicy,
  })),
);
const AdminPage = lazy(() =>
  import("./Pages/AdminPage").then((m) => ({ default: m.AdminPage })),
);

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

const PRODUCT = {
  id: "veda-kit",
  name: "VedaGlow 28-Day Kit",
  price: 299,
};

const getDiscountedPrice = (qty: number) => {
  if (qty === 1) return 299;
  if (qty === 2) return 499;
  return 499 + (qty - 2) * 299;
};

type LegalPage = "privacy" | "cookie" | "terms" | "refund" | "shipping" | null;

function getLegalPageByPath(pathname: string): LegalPage {
  const normalizedPath = (pathname.replace(/\/+$/, "") || "/").toLowerCase();

  if (normalizedPath === "/privacy-policy") return "privacy";
  if (normalizedPath === "/cookie-policy") return "cookie";
  if (normalizedPath === "/terms-and-conditions") return "terms";
  if (normalizedPath === "/return-and-refund-policy") return "refund";
  if (normalizedPath === "/shipping-policy") return "shipping";
  return null;
}

function StorefrontApp({ legalPage }: { legalPage: LegalPage }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [page, setPage] = useState<"home" | "checkout">("home");
  const [notice, setNotice] = useState("");
  const [showExitOffer, setShowExitOffer] = useState(false);

  // Persist cart
  useEffect(() => {
    const saved = localStorage.getItem("vedaglowCart");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as CartItem[];
      window.setTimeout(() => setCartItems(parsed), 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("vedaglowCart", JSON.stringify(cartItems));
  }, [cartItems]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  };

  const addToCart = (qtyOverride = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === PRODUCT.id);
      if (existing) {
        return prev.map((item) =>
          item.id === PRODUCT.id
            ? { ...item, quantity: item.quantity + qtyOverride }
            : item,
        );
      }
      return [...prev, { ...PRODUCT, quantity: qtyOverride }];
    });
    showNotice("Added to cart");
  };

  const addToCartAndOpen = (qtyOverride = 1) => {
    addToCart(qtyOverride);
    window.setTimeout(() => setCartOpen(true), 300);
  };

  const updateCartQuantity = (id: string, nextQuantity: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(1, nextQuantity) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + getDiscountedPrice(item.quantity),
    0,
  );

  const handleCheckout = () => {
    setCartOpen(false);
    setPage("checkout");
  };

  const handleOrderPlaced = () => {
    setCartItems([]);
    setPage("home");
    showNotice("Order received. Thank you!");
  };

  // Exit offer — show once after 20s if user has scrolled
  useEffect(() => {
    let scrolled = false;
    const onScroll = () => {
      if (window.scrollY > 800) scrolled = true;
    };
    window.addEventListener("scroll", onScroll);
    const t = window.setTimeout(() => {
      if (scrolled) setShowExitOffer(true);
    }, 20000);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(t);
    };
  }, []);

  if (legalPage) {
    return (
      <Suspense
        fallback={
          <div className="mx-auto max-w-2xl p-6 text-center text-neutral-400">
            Loading...
          </div>
        }
      >
        {legalPage === "privacy" && <PrivacyPolicy />}
        {legalPage === "cookie" && <CookiePolicy />}
        {legalPage === "terms" && <TermsAndConditions />}
        {legalPage === "refund" && <ReturnRefundPolicy />}
        {legalPage === "shipping" && <ShippingPolicy />}
      </Suspense>
    );
  }

  return (
    <div className="min-h-svh min-w-0 bg-white pb-24 sm:pb-0">
      <Header cartCount={cartCount} onCartClick={() => setCartOpen(true)} />

      {notice && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-lg bg-veda-green px-4 py-2 text-white shadow-lg">
          {notice}
        </div>
      )}

      {/* Exit intent offer */}
      {showExitOffer && page === "home" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_20%_0%,rgba(16,58,47,0.35),rgba(0,0,0,0.72))] p-4 backdrop-blur-[3px]"
          onClick={() => setShowExitOffer(false)}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-[1.7rem] border border-[#e5d9c5] bg-[linear-gradient(160deg,#fffefb_0%,#f6efdf_100%)] shadow-[0_36px_90px_-50px_rgba(15,23,42,0.75)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowExitOffer(false)}
              aria-label="Close offer popup"
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#ddd1bd] bg-white/90 text-sm font-bold text-[#5e4a2e] shadow-[0_14px_28px_-22px_rgba(15,23,42,0.45)] transition-colors hover:bg-[#f7f1e5]"
            >
              ✕
            </button>
            <div className="border-b border-[#e7dcc8] bg-[linear-gradient(120deg,#133f33_0%,#205443_60%,#2a624e_100%)] px-6 py-5">
              <p className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-[#f8e8c8]">
                Limited batch offer
              </p>
              <h3 className="mt-3 font-serif text-[1.75rem] leading-none text-white sm:text-[2rem]">
                Exclusive Offer
              </h3>
            </div>
            <div className="p-6 sm:p-7">
              <p className="text-center font-serif text-[1.5rem] leading-tight text-[#173229]">
                Get 2 kits, double the results
              </p>

              <div className="mt-5 rounded-2xl border border-[#e4d8c2] bg-white/80 p-5 text-center shadow-[0_24px_48px_-36px_rgba(15,23,42,0.45)]">
                <div className="flex items-end justify-center gap-4">
                  <div>
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                      MRP
                    </p>
                    <span className="text-xl font-medium text-neutral-400 line-through">
                      ₹598
                    </span>
                  </div>
                  <span className="pb-1 text-[#b3935d]">→</span>
                  <div>
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#5a4a2d]">
                      Offer Price
                    </p>
                    <span className="text-[2.2rem] font-bold leading-none text-[#123f33]">
                      ₹499
                    </span>
                  </div>
                </div>
                <p className="mt-3 inline-flex rounded-full border border-[#d8c6a0] bg-[#f8f1e2] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#6a5331]">
                  Save ₹99 instantly
                </p>
              </div>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowExitOffer(false);
                    addToCartAndOpen(2);
                  }}
                  className="w-full rounded-xl bg-[linear-gradient(120deg,#144535_0%,#205443_100%)] px-6 py-4 text-base font-bold text-white shadow-[0_24px_44px_-26px_rgba(20,69,53,0.7)] transition-all hover:-translate-y-0.5 hover:bg-[linear-gradient(120deg,#103d2f_0%,#1a4a3b_100%)]"
                >
                  Get 2 Kits for ₹499
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExitOffer(false);
                    addToCartAndOpen(1);
                  }}
                  className="w-full rounded-xl border border-[#d9cfbc] bg-white/80 px-6 py-3.5 text-sm font-semibold text-[#374151] transition-colors hover:bg-[#f8f5ef]"
                >
                  Continue with 1 Kit (₹299)
                </button>
              </div>

              <p className="mt-4 text-center text-[0.72rem] font-medium text-neutral-500">
                7-day guarantee · Fast delivery · Secure checkout
              </p>
            </div>
          </div>
        </div>
      )}

      {page === "checkout" ? (
        <Suspense
          fallback={
            <div className="mx-auto max-w-2xl p-6 text-center text-neutral-400">
              Loading...
            </div>
          }
        >
          <Checkout
            cartItems={cartItems}
            onBack={() => setPage("home")}
            onPlaceOrder={handleOrderPlaced}
            onQuantityChange={updateCartQuantity}
          />
        </Suspense>
      ) : (
        <>
          <main>
            <Hero onAddToCart={addToCartAndOpen} />
            <Problem onAddToCart={addToCartAndOpen} />
            <Solution onAddToCart={addToCartAndOpen} />
            <HowItWorks onAddToCart={addToCartAndOpen} />
            <Testimonials />
            <OfferBanner onAddToCart={addToCartAndOpen} />
            <Trust />
            <CTA onAddToCart={addToCartAndOpen} />
          </main>
          <Footer />
        </>
      )}

      {cartOpen && page === "home" && (
        <CartPanel
          cartItems={cartItems}
          cartTotal={cartTotal}
          onClose={() => setCartOpen(false)}
          onRemove={removeFromCart}
          onQuantityChange={updateCartQuantity}
          onCheckout={handleCheckout}
          onAddProduct={() => addToCart(1)}
        />
      )}
    </div>
  );
}

function App() {
  const [currentPath, setCurrentPath] = useState(
    () => window.location.pathname,
  );

  useEffect(() => {
    const updatePath = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", updatePath);
    window.addEventListener("app:navigate", updatePath);

    return () => {
      window.removeEventListener("popstate", updatePath);
      window.removeEventListener("app:navigate", updatePath);
    };
  }, []);

  const normalizedPath = (currentPath.replace(/\/+$/, "") || "/").toLowerCase();
  const legalPage = getLegalPageByPath(currentPath);

  // Define valid routes
  const validRoutes = [
    "/",
    "/login",
    "/admin",
    "/privacy-policy",
    "/cookie-policy",
    "/terms-and-conditions",
    "/return-and-refund-policy",
    "/shipping-policy",
    "/checkout",
  ];

  // Check if current path is valid, if not show 404
  const isValidPath = validRoutes.some(
    (route) => normalizedPath === route.toLowerCase(),
  );

  if (!isValidPath) {
    return (
      <ErrorBoundary>
        <NotFoundPage />
      </ErrorBoundary>
    );
  }

  if (normalizedPath === "/login" || normalizedPath === "/admin") {
    return (
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="mx-auto max-w-2xl p-6 text-center text-neutral-400">
              Loading...
            </div>
          }
        >
          <AdminPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <StorefrontApp legalPage={legalPage} />
    </ErrorBoundary>
  );
}

export default App;
