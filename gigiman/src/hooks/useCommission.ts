import { useState, useCallback, useEffect } from "react";
import {
  getCommissionStatusApi,
  rechargeCommissionApi,
  verifyCommissionPaymentApi,
  CommissionStatusResponse,
} from "../api/commission.api";
import { Alert } from "react-native";

export const useCommission = () => {
  const [status, setStatus] = useState<CommissionStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCommissionStatusApi();
      if (res && res.data) {
        setStatus(res.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fetch commission status");
    } finally {
      setLoading(false);
    }
  }, []);

  const recharge = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await rechargeCommissionApi();
      return res.data;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Recharge init failed";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (data: {
    amount: number;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      await verifyCommissionPaymentApi(data);
      await fetchStatus();
      return true;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Payment verification failed";
      setError(msg);
      Alert.alert("Verification Error", msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    loading,
    error,
    fetchStatus,
    recharge,
    verifyPayment,
  };
};
