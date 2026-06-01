import { useEffect, useMemo, useRef, useState } from "react";
import { RazorpayButton, type RazorpayPaymentResult } from "./RazorpayButton";
import { OrderSuccess } from "./OrderSuccess";
import { getPriceByQty } from "../utils/pricing";

const API_URL = (import.meta.env.VITE_API_URL as string) || "/api";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type Props = {
  cartItems: CartItem[];
  onBack: () => void;
  onPlaceOrder: () => void;
  onQuantityChange: (id: string, quantity: number) => void;
  onError?: (message: string) => void;
};

type CheckoutStep = "address" | "payment" | "submitted";
type PaymentMethod = "cod" | "razorpay";

type AddressForm = {
  name: string;
  email: string;
  phone: string;
  pincode: string;
  city: string;
  state: string;
  address: string;
  landmark: string;
};

type PincodeStatus = "idle" | "loading" | "success" | "error";

const COD_ADVANCE = 39; // COD confirmation advance in INR
const SINGLE_KIT_PRICE = 299;
const SINGLE_KIT_DELIVERY_CHARGE = 39;
const PINCODE_DEBOUNCE_MS = 500;

function StepBadge({
  number,
  label,
  active,
  complete,
}: {
  number: number;
  label: string;
  active: boolean;
  complete: boolean;
}) {
  const tone = complete
    ? "bg-emerald-100 text-emerald-700"
    : active
      ? "bg-veda-green text-white"
      : "bg-neutral-200 text-neutral-600";
  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${tone}`}
      >
        {number}
      </div>
      <p
        className={`mt-1 text-xs font-medium ${active || complete ? "text-veda-green" : "text-neutral-600"}`}
      >
        {label}
      </p>
    </div>
  );
}

function PriceSummary({
  productPrice,
  deliveryCharge,
  couponDiscount,
  isCod,
  totalAmount,
  remainingOnDelivery,
}: {
  productPrice: number;
  deliveryCharge: number;
  couponDiscount: number;
  isCod: boolean;
  totalAmount: number;
  remainingOnDelivery: number;
}) {
  return (
    <div className="mt-4 border-t border-neutral-200 pt-3 space-y-1">
      <div className="flex justify-between text-sm text-neutral-600">
        <span>Product Price</span>
        <span className="font-medium text-neutral-800">₹{productPrice}</span>
      </div>
      {couponDiscount > 0 && (
        <div className="flex justify-between text-sm font-semibold text-emerald-600">
          <span>Coupon Discount</span>
          <span>-₹{couponDiscount}</span>
        </div>
      )}
      <div className="flex justify-between text-sm text-neutral-600">
        <span>Delivery</span>
        <span
          className={`font-semibold ${deliveryCharge > 0 ? "text-neutral-800" : "text-emerald-600"}`}
        >
          {deliveryCharge > 0 ? `₹${deliveryCharge}` : "Free"}
        </span>
      </div>
      {isCod && (
        <>
          <div className="flex justify-between text-sm text-neutral-600">
            <span>COD Confirmation Advance</span>
            <span className="font-medium text-neutral-800">₹{COD_ADVANCE}</span>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-2 text-sm font-bold text-amber-700">
            <span>Pay Now</span>
            <span>₹{COD_ADVANCE}</span>
          </div>
          <div className="flex justify-between text-sm text-neutral-500">
            <span>Remaining on Delivery</span>
            <span>₹{remainingOnDelivery}</span>
          </div>
        </>
      )}
      <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-bold">
        <span>Total Amount</span>
        <span className="text-veda-green">₹{totalAmount}</span>
      </div>
    </div>
  );
}

function SummaryCard({
  mainItem,
  deliveryCharge,
  couponDiscount,
  isCod,
  totalAmount,
  remainingOnDelivery,
  onQuantityChange,
}: {
  mainItem: CartItem | undefined;
  deliveryCharge: number;
  couponDiscount: number;
  isCod: boolean;
  totalAmount: number;
  remainingOnDelivery: number;
  onQuantityChange: (id: string, quantity: number) => void;
}) {
  if (!mainItem) {
    return (
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4">
        <p className="text-sm text-neutral-500">Cart is empty.</p>
      </div>
    );
  }

  const qty = mainItem.quantity;
  const { discounted, original, savings, isMostPopular } = getPriceByQty(qty);

  return (
    <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Product summary</h3>
        {isMostPopular && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
            Most Popular
          </span>
        )}
      </div>
      <div className="rounded-lg border border-neutral-200 p-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold">{mainItem.name}</p>
            <p className="text-xs text-neutral-500">Unit price ₹299</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onQuantityChange(mainItem.id, Math.max(1, qty - 1))
              }
              className="h-8 w-8 rounded border border-neutral-300 text-veda-green"
            >
              -
            </button>
            <span className="min-w-6 text-center font-semibold">{qty}</span>
            <button
              type="button"
              onClick={() => onQuantityChange(mainItem.id, qty + 1)}
              className="h-8 w-8 rounded border border-neutral-300 bg-veda-green text-white"
            >
              +
            </button>
          </div>
        </div>
        <div className="mt-3 border-t border-neutral-200 pt-3 space-y-1">
          <div className="flex justify-between text-sm font-semibold">
            <span>Price</span>
            <span>₹{discounted}</span>
          </div>
          {savings > 0 && (
            <>
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Original (MRP)</span>
                <span className="line-through">₹{original}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-emerald-700">
                <span>Bundle Savings</span>
                <span>-₹{savings}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-xs font-semibold text-neutral-600">
            <span>Delivery</span>
            <span>{deliveryCharge > 0 ? `₹${deliveryCharge}` : "Free"}</span>
          </div>
        </div>
      </div>

      {!couponDiscount && (
        <p
          className={`mt-2 text-xs font-semibold ${qty < 2 ? "text-amber-700" : "text-emerald-700"}`}
        >
          {qty < 2
            ? "Upgrade to 2 kits at ₹499 for better value and free delivery."
            : qty === 2
              ? "Excellent choice. Your 2-kit value pricing is active."
              : "Bundle value pricing is active on this order."}
        </p>
      )}

      <PriceSummary
        productPrice={discounted}
        deliveryCharge={deliveryCharge}
        couponDiscount={couponDiscount}
        isCod={isCod}
        totalAmount={totalAmount}
        remainingOnDelivery={remainingOnDelivery}
      />
    </div>
  );
}

export function Checkout({
  cartItems,
  onBack,
  onPlaceOrder,
  onQuantityChange,
}: Props) {
  const [step, setStep] = useState<CheckoutStep>("address");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<AddressForm>({
    name: "",
    email: "",
    phone: "",
    pincode: "",
    city: "",
    state: "",
    address: "",
    landmark: "",
  });
  const [pincodeStatus, setPincodeStatus] = useState<PincodeStatus>("idle");
  const [razorpayResult, setRazorpayResult] =
    useState<RazorpayPaymentResult | null>(null);
  const [codAdvanceResult, setCodAdvanceResult] =
    useState<RazorpayPaymentResult | null>(null);
  const [backendOrder, setBackendOrder] = useState<{
    orderId: string;
    orderNumber: number | null;
    idempotencyKey: string;
    orderAccessToken: string;
    razorpayKeyId: string;
    razorpayOrderId: string;
    amount: number;
    currency: string;
  } | null>(null);
  const [orderCreating, setOrderCreating] = useState(false);
  const [orderError, setOrderError] = useState("");

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);
  const [couponStatus, setCouponStatus] = useState<
    "idle" | "loading" | "error" | "success"
  >("idle");
  const [couponMessage, setCouponMessage] = useState("");
  const couponAbortRef = useRef<AbortController | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  // ============================================================================
  // FIX: Generate NEW idempotency key for each checkout attempt
  // ============================================================================
  // PROBLEM: idempotencyKey was generated once and reused
  // - When cart changes, backend finds existing order with old quantity
  // - Returns stale Razorpay order_id with wrong amount
  // SOLUTION: Generate fresh key when cart changes or payment method changes
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());
  const mainItem = cartItems[0];
  const qty = mainItem?.quantity ?? 1;
  const canProceed = cartItems.length > 0;

  // Pincode autofill
  useEffect(() => {
    if (form.pincode.length !== 6) {
      if (pincodeStatus !== "idle") setPincodeStatus("idle");
      return;
    }
    setPincodeStatus("loading");
    const timer = setTimeout(async () => {
      try {
        // Use server-side cached lookup to avoid client-side rate limits
        const res = await fetch(`${API_URL}/pincode/${form.pincode}`);
        const data = await res.json();
        if (data?.success) {
          setForm((prev) => ({
            ...prev,
            city: data.city ?? prev.city,
            state: data.state ?? prev.state,
          }));
          setErrors((prev) => ({ ...prev, city: "", state: "", pincode: "" }));
          setPincodeStatus("success");
        } else {
          setPincodeStatus("error");
        }
      } catch {
        setPincodeStatus("error");
      }
    }, PINCODE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.pincode]);

  useEffect(() => {
    if (step === "address") nameRef.current?.focus();
  }, [step]);

  const isCod = paymentMethod === "cod";
  const productPrice = useMemo(() => getPriceByQty(qty).discounted, [qty]);
  const deliveryCharge =
    canProceed && productPrice === SINGLE_KIT_PRICE
      ? SINGLE_KIT_DELIVERY_CHARGE
      : 0;

  // ============================================================================
  // FIX: Reset payment state when cart changes
  // ============================================================================
  // PROBLEM: When user closes Razorpay modal and updates cart:
  // - Old backendOrder state is retained with stale razorpayOrderId
  // - Old amount is used instead of new cart total
  // SOLUTION: Clear all payment state when cart changes
  useEffect(() => {
    // Generate NEW idempotency key for fresh order
    idempotencyKeyRef.current = crypto.randomUUID();

    // Clear all payment state to force new order creation
    setBackendOrder(null);
    setRazorpayResult(null);
    setCodAdvanceResult(null);
    setOrderError("");

    // Revalidate coupon with new cart total
    if (appliedCoupon && step === "address") {
      validateCoupon(appliedCoupon.code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qty, productPrice]);

  // ============================================================================
  // FIX: Create order when payment screen loads or payment method changes
  // ============================================================================
  useEffect(() => {
    if (step === "payment" && !backendOrder && !orderCreating) {
      // Generate fresh idempotency key
      idempotencyKeyRef.current = crypto.randomUUID();

      // Create order with current payment method
      createBackendOrder(paymentMethod === "cod" ? "cod" : "razorpay");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, paymentMethod]);

  // ============================================================================
  // FIX: Recreate order when payment method changes
  // ============================================================================
  useEffect(() => {
    if (step === "payment" && backendOrder) {
      const currentPaymentType = paymentMethod === "cod" ? "cod" : "razorpay";

      // Check if payment type changed
      if (backendOrder.orderId) {
        // Clear backend order and recreate
        setBackendOrder(null);
        setRazorpayResult(null);
        setCodAdvanceResult(null);
        setOrderError("");

        // Generate fresh idempotency key
        idempotencyKeyRef.current = crypto.randomUUID();

        // Create new order with correct payment type
        createBackendOrder(currentPaymentType);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod]);

  const totalAmount = useMemo(
    () =>
      Math.max(
        0,
        productPrice + deliveryCharge - (appliedCoupon?.discountAmount ?? 0),
      ),
    [productPrice, deliveryCharge, appliedCoupon],
  );
  const remainingOnDelivery = Math.max(
    0,
    totalAmount - (isCod ? COD_ADVANCE : 0),
  );
  const fullAddress = `${form.address}${form.landmark.trim() ? `, ${form.landmark.trim()}` : ""}, ${form.city}, ${form.state} - ${form.pincode}`;

  const validateCoupon = async (codeToValidate: string) => {
    if (!codeToValidate.trim()) return;
    setCouponStatus("loading");
    setCouponMessage("");
    // Cancel any previous in-flight request
    try {
      couponAbortRef.current?.abort();
    } catch {}
    const ac = new AbortController();
    couponAbortRef.current = ac;

    try {
      const res = await fetch(`${API_URL}/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ac.signal,
        body: JSON.stringify({
          couponCode: codeToValidate,
          items: cartItems.map((i) => ({ id: i.id, quantity: i.quantity })),
          customer: {
            email: form.email || undefined,
            phone: form.phone || undefined,
          },
        }),
      });

      // Clear abort ref after successful network response
      couponAbortRef.current = null;

      const data = await res.json();

      if (data.valid) {
        setAppliedCoupon({
          code: codeToValidate,
          discountAmount: data.discountAmount,
        });
        setCouponStatus("success");
        setCouponMessage(`Wow! You saved ₹${data.discountAmount}`);
        setCouponInput("");
      } else {
        setAppliedCoupon(null);
        setCouponStatus("error");
        setCouponMessage(data.message || "Invalid coupon code");
      }
    } catch (err) {
      if ((err as any)?.name === "AbortError") {
        // Request was cancelled - keep current state or reset to idle
        setCouponStatus("idle");
        return;
      }
      setCouponStatus("error");
      setCouponMessage("Failed to validate coupon");
      setAppliedCoupon(null);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponStatus("idle");
    setCouponMessage("");
  };

  const createBackendOrder = async (paymentType: "cod" | "razorpay") => {
    setOrderCreating(true);
    setOrderError("");

    // ============================================================================
    // FIX: Always create NEW order with current cart state
    // ============================================================================
    const orderPayload = {
      customer: {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: fullAddress,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      },
      items: cartItems.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      paymentType,
      idempotencyKey: idempotencyKeyRef.current,
      couponCode: appliedCoupon?.code,
    };

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        setOrderError(data?.message || "Failed to create order.");
        return null;
      }

      if (data.razorpay) {
        // ============================================================================
        // FIX: Store amount in RUPEES (not paise)
        // ============================================================================
        // Backend sends amount in RUPEES (e.g., 39 for COD, 299 for prepaid)
        // RazorpayButton will convert to paise (multiply by 100)
        setBackendOrder({
          orderId: data.order.id,
          orderNumber: data.order.orderNumber ?? null,
          idempotencyKey: idempotencyKeyRef.current,
          orderAccessToken: data.orderAccessToken ?? "",
          razorpayKeyId: data.razorpay.keyId,
          razorpayOrderId: data.razorpay.orderId,
          amount: data.razorpay.amount, // Already in RUPEES from backend
          currency: data.razorpay.currency,
        });
      } else {
        // No Razorpay object (shouldn't happen in current flow)
        setBackendOrder({
          orderId: data.order.id,
          orderNumber: data.order.orderNumber ?? null,
          idempotencyKey: idempotencyKeyRef.current,
          orderAccessToken: data.orderAccessToken ?? "",
          razorpayKeyId: "",
          razorpayOrderId: "",
          amount: 0,
          currency: "INR",
        });
      }

      return data;
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : "Network error.");
      return null;
    } finally {
      setOrderCreating(false);
    }
  };

  const setField =
    (key: keyof AddressForm) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const rawValue = e.target.value;
      const nextValue =
        key === "phone"
          ? rawValue
              .replace(/\D/g, "")
              .replace(/^91(?=\d{10,}$)/, "")
              .slice(0, 10)
          : rawValue;
      setForm((prev) => ({ ...prev, [key]: nextValue }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
      if (key === "pincode") setPincodeStatus("idle");
    };

  const validateAddress = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!form.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Enter a valid email address";
    }
    if (!form.phone.trim()) {
      nextErrors.phone = "Phone is required";
    } else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, ""))) {
      nextErrors.phone = "Enter a valid 10-digit Indian number";
    }
    if (!form.pincode.trim()) {
      nextErrors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(form.pincode)) {
      nextErrors.pincode = "Enter 6-digit pincode";
    }
    if (!form.state.trim()) nextErrors.state = "State is required";
    if (!form.city.trim()) nextErrors.city = "City is required";
    if (!form.address.trim()) nextErrors.address = "Address is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleProceedToPayment = async () => {
    if (!canProceed || !validateAddress()) return;

    // ============================================================================
    // FIX: Don't create order yet - just move to payment screen
    // ============================================================================
    // Order will be created when user clicks the actual payment button
    // This ensures the correct payment type is used

    // Clear previous payment state
    setRazorpayResult(null);
    setCodAdvanceResult(null);
    setBackendOrder(null);
    setOrderError("");

    // Move to payment screen
    setStep("payment");
  };

  const handlePrimaryBack = () => {
    if (step === "address") {
      onBack();
      return;
    }
    if (step === "payment") {
      setStep("address");
      return;
    }
    onPlaceOrder();
  };

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <button
        type="button"
        className="mb-4 text-sm font-medium text-veda-green"
        onClick={handlePrimaryBack}
      >
        ←{" "}
        {step === "address"
          ? "Back"
          : step === "payment"
            ? "Back to Address"
            : "Back to Home"}
      </button>

      <div className="mb-7 flex items-center justify-between">
        <StepBadge
          number={1}
          label="Address"
          active={step === "address"}
          complete={step !== "address"}
        />
        <div className="mx-2 h-1 flex-1 bg-neutral-200" />
        <StepBadge
          number={2}
          label="Payment"
          active={step === "payment"}
          complete={step === "submitted"}
        />
        <div className="mx-2 h-1 flex-1 bg-neutral-200" />
        <StepBadge
          number={3}
          label="Confirm"
          active={step === "submitted"}
          complete={false}
        />
      </div>

      {/* ── ADDRESS ── */}
      {step === "address" && (
        <>
          <h2 className="text-2xl font-semibold text-veda-green">Checkout</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Fill your address details to continue to payment.
          </p>

          <div className="mt-6 grid gap-4 rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
            <div>
              <input
                ref={nameRef}
                value={form.name}
                onChange={setField("name")}
                placeholder="Full Name"
                className={`w-full rounded-lg border px-4 py-3 text-base ${errors.name ? "border-red-500 bg-red-50" : "border-neutral-300"}`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            <div>
              <input
                value={form.email}
                onChange={setField("email")}
                placeholder="Email Address"
                inputMode="email"
                className={`w-full rounded-lg border px-4 py-3 text-base ${errors.email ? "border-red-500 bg-red-50" : "border-neutral-300"}`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            <div>
              <div
                className={`flex items-center rounded-lg border bg-white ${errors.phone ? "border-red-500 bg-red-50" : "border-neutral-300"}`}
              >
                <span className="rounded-l-lg border-r border-neutral-200 bg-neutral-50 px-3 py-3 text-sm font-semibold text-neutral-700">
                  +91
                </span>
                <input
                  value={form.phone}
                  onChange={setField("phone")}
                  placeholder="10-digit mobile number"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  className="w-full bg-transparent px-3 py-3 text-base outline-none"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>
            <div>
              <input
                value={form.pincode}
                onChange={setField("pincode")}
                placeholder="Pincode"
                maxLength={6}
                inputMode="numeric"
                className={`w-full rounded-lg border px-4 py-3 text-base ${errors.pincode ? "border-red-500 bg-red-50" : "border-neutral-300"}`}
              />
              {pincodeStatus === "loading" && (
                <p className="mt-1 text-sm text-blue-500">
                  Fetching location...
                </p>
              )}
              {pincodeStatus === "error" && (
                <p className="mt-1 text-sm text-red-600">Invalid Pincode</p>
              )}
              {errors.pincode && pincodeStatus !== "error" && (
                <p className="mt-1 text-sm text-red-600">{errors.pincode}</p>
              )}
            </div>
            <div>
              <textarea
                value={form.address}
                onChange={setField("address")}
                rows={3}
                placeholder="Full Address (House no, Street, Area)"
                className={`w-full rounded-lg border px-4 py-3 text-base ${errors.address ? "border-red-500 bg-red-50" : "border-neutral-300"}`}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>
            <div>
              <input
                value={form.landmark}
                onChange={setField("landmark")}
                placeholder="Landmark (optional)"
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-base"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <input
                  value={form.city}
                  onChange={setField("city")}
                  placeholder="City"
                  className={`w-full rounded-lg border px-4 py-3 text-base ${errors.city ? "border-red-500 bg-red-50" : "border-neutral-300"}`}
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </div>
              <div>
                <input
                  value={form.state}
                  onChange={setField("state")}
                  placeholder="State"
                  className={`w-full rounded-lg border px-4 py-3 text-base ${errors.state ? "border-red-500 bg-red-50" : "border-neutral-300"}`}
                />
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                )}
              </div>
            </div>
          </div>

          {/* Coupon Section */}
          <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
            <h3 className="mb-3 text-base font-semibold">
              Have a coupon code?
            </h3>
            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <span className="font-bold text-emerald-800 uppercase">
                      {appliedCoupon.code}
                    </span>
                    <p className="text-xs text-emerald-600 sm:text-sm">
                      {couponMessage}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-sm font-semibold text-rose-600 hover:text-rose-700"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      // Don't transform during composition (mobile keyboard prediction)
                      const value = e.target.value;
                      setCouponInput(value);
                      if (couponStatus !== "idle") setCouponStatus("idle");
                    }}
                    onBlur={(e) => {
                      // Transform to uppercase only on blur (after typing is done)
                      setCouponInput(e.target.value.toUpperCase());
                    }}
                    placeholder="Enter coupon code"
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-base uppercase transition-colors focus:border-veda-green focus:outline-none focus:ring-1 focus:ring-veda-green"
                    disabled={couponStatus === "loading"}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="characters"
                    spellCheck="false"
                    inputMode="text"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={() => validateCoupon(couponInput.toUpperCase())}
                    disabled={!couponInput.trim() || couponStatus === "loading"}
                    className="inline-flex min-w-[90px] items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {couponStatus === "loading" ? "..." : "Apply"}
                  </button>
                </div>
                {couponStatus === "error" && (
                  <p className="mt-2 text-sm text-red-600">{couponMessage}</p>
                )}
              </div>
            )}
          </div>

          <SummaryCard
            mainItem={mainItem}
            deliveryCharge={deliveryCharge}
            couponDiscount={appliedCoupon?.discountAmount ?? 0}
            isCod={isCod}
            totalAmount={totalAmount}
            remainingOnDelivery={remainingOnDelivery}
            onQuantityChange={onQuantityChange}
          />

          {orderError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-semibold text-red-700">{orderError}</p>
            </div>
          )}

          <button
            type="button"
            disabled={!canProceed || orderCreating}
            onClick={handleProceedToPayment}
            className="mt-5 w-full rounded-lg bg-veda-green px-4 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#1A4F34] disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {orderCreating ? "Creating order..." : "Proceed to Payment"}
          </button>
        </>
      )}

      {/* ── PAYMENT ── */}
      {step === "payment" && (
        <>
          <h2 className="text-2xl font-semibold text-veda-green">
            Choose Payment Method
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Select how you'd like to pay for your order.
          </p>

          {/* Order Summary (Read-only) */}
          <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
            <h3 className="mb-3 text-base font-semibold text-neutral-800">
              Order Summary
            </h3>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-neutral-800">
                    {mainItem?.name}
                  </p>
                  <p className="text-sm text-neutral-500">
                    Quantity: {qty} {qty === 1 ? "kit" : "kits"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-veda-green">
                    ₹{productPrice}
                  </p>
                  {deliveryCharge > 0 && (
                    <p className="text-xs text-neutral-500">
                      + ₹{deliveryCharge} delivery
                    </p>
                  )}
                </div>
              </div>
              {appliedCoupon && (
                <div className="mt-3 flex items-center justify-between border-t border-neutral-200 pt-3">
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm font-semibold text-emerald-700">
                      Coupon Applied: {appliedCoupon.code}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-emerald-700">
                    -₹{appliedCoupon.discountAmount}
                  </span>
                </div>
              )}
              <div className="mt-3 flex items-center justify-between border-t border-neutral-200 pt-3">
                <span className="text-base font-bold text-neutral-800">
                  Total Amount
                </span>
                <span className="text-xl font-bold text-veda-green">
                  ₹{totalAmount}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep("address")}
              className="mt-3 text-sm font-medium text-veda-green hover:underline"
            >
              ← Edit order details
            </button>
          </div>

          {/* Payment Method Selection */}
          <div className="mt-6">
            <h3 className="mb-3 text-base font-semibold text-neutral-800">
              Select Payment Method
            </h3>
            <div className="grid gap-3">
              {/* COD Option */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("cod");
                  setCodAdvanceResult(null);
                }}
                className={`flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                  isCod
                    ? "border-amber-500 bg-amber-50 shadow-sm"
                    : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm"
                }`}
              >
                <span
                  className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    isCod
                      ? "border-amber-500 bg-amber-500"
                      : "border-neutral-300 bg-white"
                  }`}
                >
                  {isCod && (
                    <svg
                      className="h-3.5 w-3.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-bold text-neutral-800">
                      Cash on Delivery
                    </p>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                      Popular
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">
                    Pay ₹{COD_ADVANCE} now to confirm your order
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Pay ₹{remainingOnDelivery} on delivery
                    </span>
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      Secure payment
                    </span>
                  </div>
                </div>
              </button>

              {/* Online Payment Option */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("razorpay");
                  setRazorpayResult(null);
                }}
                className={`flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                  !isCod
                    ? "border-veda-green bg-emerald-50 shadow-sm"
                    : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm"
                }`}
              >
                <span
                  className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    !isCod
                      ? "border-veda-green bg-veda-green"
                      : "border-neutral-300 bg-white"
                  }`}
                >
                  {!isCod && (
                    <svg
                      className="h-3.5 w-3.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-bold text-neutral-800">
                      Online Payment
                    </p>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                      Instant
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">
                    Pay full amount (₹{totalAmount}) via Card, UPI, or
                    Netbanking
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      No cash needed
                    </span>
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Faster processing
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Payment Action Section */}
          <div className="mt-6">
            {/* COD Payment */}
            {isCod && (
              <div className="rounded-xl border border-amber-200 bg-linear-to-br from-amber-50 to-orange-50 p-5 sm:p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-amber-900">
                      Cash on Delivery
                    </h3>
                    <p className="mt-1 text-sm text-amber-800">
                      Confirm your order with ₹{COD_ADVANCE} advance payment
                    </p>
                  </div>
                  <div className="rounded-lg bg-white px-3 py-2 text-center shadow-sm">
                    <p className="text-xs font-semibold text-neutral-600">
                      Pay Now
                    </p>
                    <p className="text-xl font-bold text-amber-600">
                      ₹{COD_ADVANCE}
                    </p>
                  </div>
                </div>

                <div className="mb-4 rounded-lg border border-amber-200 bg-white p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">Advance Payment</span>
                    <span className="font-semibold text-neutral-800">
                      ₹{COD_ADVANCE}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-neutral-200 pt-2 text-sm">
                    <span className="text-neutral-600">
                      Balance (pay on delivery)
                    </span>
                    <span className="font-bold text-amber-700">
                      ₹{remainingOnDelivery}
                    </span>
                  </div>
                </div>

                {codAdvanceResult?.status === "success" && (
                  <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <svg
                        className="h-6 w-6 text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-base font-bold text-emerald-700">
                        Payment Successful!
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-emerald-600">
                      Payment ID: {codAdvanceResult.paymentId}
                    </p>
                  </div>
                )}

                {codAdvanceResult?.status === "failed" && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-center text-sm font-semibold text-red-700">
                      Payment failed. Please try again.
                    </p>
                  </div>
                )}

                {codAdvanceResult?.status === "dismissed" && (
                  <div className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-center text-sm text-neutral-600">
                      Payment cancelled. Click below to try again.
                    </p>
                  </div>
                )}

                {codAdvanceResult?.status !== "success" && backendOrder && (
                  <RazorpayButton
                    customerName={form.name}
                    customerPhone={form.phone}
                    customerEmail={form.email}
                    description="VedaGlow COD Confirmation"
                    backendOrder={backendOrder}
                    onResult={(result) => {
                      setCodAdvanceResult(result);
                      if (result.status === "success") {
                        setStep("submitted");
                      }
                    }}
                    className="w-full rounded-xl bg-linear-to-r from-amber-500 to-orange-500 px-6 py-4 text-base font-bold text-white shadow-lg transition-all hover:from-amber-600 hover:to-orange-600 hover:shadow-xl disabled:cursor-not-allowed disabled:from-neutral-300 disabled:to-neutral-300 disabled:shadow-none"
                  >
                    Pay ₹{COD_ADVANCE} to Confirm Order
                  </RazorpayButton>
                )}

                {codAdvanceResult?.status !== "success" && !backendOrder && (
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-center">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-amber-500" />
                    <p className="mt-2 text-sm text-neutral-600">
                      Preparing your order...
                    </p>
                  </div>
                )}

                <p className="mt-3 text-center text-xs text-neutral-500">
                  Secure payment powered by Razorpay
                </p>
              </div>
            )}

            {/* Online Payment */}
            {!isCod && (
              <div className="rounded-xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-teal-50 p-5 sm:p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-emerald-900">
                      Online Payment
                    </h3>
                    <p className="mt-1 text-sm text-emerald-800">
                      Pay securely via Card, UPI, or Netbanking
                    </p>
                  </div>
                  <div className="rounded-lg bg-white px-3 py-2 text-center shadow-sm">
                    <p className="text-xs font-semibold text-neutral-600">
                      Total Amount
                    </p>
                    <p className="text-xl font-bold text-emerald-600">
                      ₹{totalAmount}
                    </p>
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-emerald-200 bg-white p-2 text-center">
                    <svg
                      className="mx-auto h-6 w-6 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    <p className="mt-1 text-xs font-medium text-neutral-700">
                      Cards
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-white p-2 text-center">
                    <svg
                      className="mx-auto h-6 w-6 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="mt-1 text-xs font-medium text-neutral-700">
                      UPI
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-white p-2 text-center">
                    <svg
                      className="mx-auto h-6 w-6 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <p className="mt-1 text-xs font-medium text-neutral-700">
                      Banking
                    </p>
                  </div>
                </div>

                {razorpayResult?.status === "success" && (
                  <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <svg
                        className="h-6 w-6 text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-base font-bold text-emerald-700">
                        Payment Successful!
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-emerald-600">
                      Payment ID: {razorpayResult.paymentId}
                    </p>
                  </div>
                )}

                {razorpayResult?.status === "failed" && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-center text-sm font-semibold text-red-700">
                      Payment failed. Please try again.
                    </p>
                  </div>
                )}

                {razorpayResult?.status === "dismissed" && (
                  <div className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-center text-sm text-neutral-600">
                      Payment cancelled. Click below to try again.
                    </p>
                  </div>
                )}

                {razorpayResult?.status !== "success" && backendOrder && (
                  <RazorpayButton
                    customerName={form.name}
                    customerPhone={form.phone}
                    customerEmail={form.email}
                    backendOrder={backendOrder}
                    onResult={(result) => {
                      setRazorpayResult(result);
                      if (result.status === "success") {
                        setStep("submitted");
                      }
                    }}
                    className="w-full rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4 text-base font-bold text-white shadow-lg transition-all hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl disabled:cursor-not-allowed disabled:from-neutral-300 disabled:to-neutral-300 disabled:shadow-none"
                  >
                    Pay ₹{totalAmount} Securely
                  </RazorpayButton>
                )}

                {razorpayResult?.status !== "success" && !backendOrder && (
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-center">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-emerald-500" />
                    <p className="mt-2 text-sm text-neutral-600">
                      Preparing your order...
                    </p>
                  </div>
                )}

                <p className="mt-3 text-center text-xs text-neutral-500">
                  Secure payment powered by Razorpay
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── SUBMITTED ── */}
      {step === "submitted" && (
        <OrderSuccess
          name={form.name}
          orderId={backendOrder?.orderId ?? ""}
          orderNumber={backendOrder?.orderNumber ?? null}
          amount={totalAmount}
          paymentMethod={isCod ? "cod" : "razorpay"}
          remainingOnDelivery={remainingOnDelivery}
          onGoHome={onPlaceOrder}
        />
      )}
    </div>
  );
}
