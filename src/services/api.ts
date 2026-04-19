const VITE_API_URL = import.meta.env.VITE_API_URL;
if (!VITE_API_URL) {
  throw new Error(
    "VITE_API_URL environment variable is required. " +
      "Set it in your .env file (e.g., VITE_API_URL=http://localhost:5000/api)",
  );
}
const API_BASE_URL = VITE_API_URL;

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  name: string;
  phone: string;
  address: string;
  items: OrderItem[];
  totalPrice: number;
  paymentMethod: "COD" | "ONLINE";
  paymentStatus: string;
  orderStatus: string;
  advancePaid?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  order: Order;
  razorpayOrder?: {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    advanceAmount?: number;
  };
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  order: Order;
}

export interface RetryPaymentResponse {
  success: boolean;
  message: string;
  order: {
    id: string;
    paymentStatus: string;
    paymentId: string;
  };
  razorpayOrder: {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  const data = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = data as ApiError;
    throw new Error(
      error.message || `HTTP ${response.status}: ${response.statusText}`,
    );
  }

  return data as T;
}

export const api = {
  /**
   * Create a new order
   * For COD: Creates order with ADVANCE_PENDING and Razorpay order for ₹40
   * For ONLINE: Creates order with PENDING and Razorpay order for full amount
   */
  async createOrder(data: {
    name: string;
    phone: string;
    address: string;
    items: OrderItem[];
    totalPrice: number;
    paymentMethod: "COD" | "ONLINE";
  }): Promise<CreateOrderResponse> {
    const response = await fetch(`${API_BASE_URL}/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return handleResponse<CreateOrderResponse>(response);
  },

  /**
   * Verify Razorpay payment
   * Called after Razorpay payment is completed
   */
  async verifyPayment(data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<VerifyPaymentResponse> {
    const response = await fetch(`${API_BASE_URL}/verify-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return handleResponse<VerifyPaymentResponse>(response);
  },

  /**
   * Retry failed payment
   * Creates a new Razorpay order for the same order
   */
  async retryPayment(orderId: string): Promise<RetryPaymentResponse> {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/retry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return handleResponse<RetryPaymentResponse>(response);
  },

  /**
   * Check server health
   */
  async health(): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE_URL.replace("/api", "")}/health`);
    return handleResponse<{ status: string; message: string }>(response);
  },
};
