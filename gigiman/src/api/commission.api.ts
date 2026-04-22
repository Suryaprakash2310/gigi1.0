import api from "./client";

export interface CommissionStatusResponse {
  totalUnpaid: number;
  isBlocked: boolean;
  threshold: number;
  message?: string;
}

export interface CommissionRechargeResponse {
  success: boolean;
  fullAmountToPay: number;
  order: {
    id: string;
    amount: number;
    key: string;
  };
}

export const getCommissionStatusApi = () => {
  return api.get<CommissionStatusResponse>("/commission/status");
};

export const rechargeCommissionApi = () => {
  return api.post<CommissionRechargeResponse>("/commission/recharge");
};

export const verifyCommissionPaymentApi = (data: {
  amount: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) => {
  return api.post("/commission/verify-payment", data);
};
