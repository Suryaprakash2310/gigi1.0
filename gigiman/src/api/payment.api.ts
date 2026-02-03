import api from "./client";

interface createOrderProps {
 orderId: string;
 amount: number;
 currency: string;
}

export const paymentSuccessApi = (data: {
  bookingId: string;
  paymentMethod: "CASH" | "RAZORPAY";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}) => {
  return api.post("booking/payment/success", data);
};

export const createOrder =(bookingId: string, amount?: number, currency?: string) => {
  return api.post<createOrderProps>(`booking/createorder/${bookingId}`, { amount, currency });
}