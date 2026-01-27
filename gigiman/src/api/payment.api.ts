import api from "./client";

export const paymentSuccessApi = (data: {
  bookingId: string;
  paymentMethod: "CASH" | "RAZORPAY";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}) => {
  return api.post("booking/payment/success", data);
};
