import apiClient from "./client";

export interface WalletBalanceResponse {
  balance: number;
}

export interface CreateOrderResponse {
  key: string;
  orderId: string;
  amount: number;
}

export interface VerifyAddMoneyResponse {
  message: string;
  newBalance: number;
}

export interface WithdrawResponse {
  message: string;
  newBalance: number;
}
export type TransactionType =
  | "CREDIT"
  | "DEBIT"
  | "HOLD"
  | "RELEASE"
  | "REFUND"
  | "PENALTY"
  | "COMMISSION";

export type TransactionStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED";

export interface TransactionItem {
  transactionStatus: string;
  transactionType: string;
  _id: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  referenceId?: string;
  description?: string;
  createdAt: string;
}


export const WalletAPI = {
  getBalance: async (): Promise<WalletBalanceResponse> => {
    const res = await apiClient.get<WalletBalanceResponse>("/wallet/balance");
    return res.data;
  },

  createAddMoneyOrder: async (amount: number): Promise<CreateOrderResponse> => {
    const res = await apiClient.post<CreateOrderResponse>("/wallet/add-money", {
      amount,
    });
    console.log("Create order response:", res.data);
    return res.data;
  },

  verifyAddMoney: async (payload: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): Promise<VerifyAddMoneyResponse> => {
    const res = await apiClient.post<VerifyAddMoneyResponse>("/wallet/verify", payload);
    return res.data;
  },

  withdrawMoney: async (amount: number): Promise<WithdrawResponse> => {
    const res = await apiClient.post<WithdrawResponse>("/wallet/withdraw", {
      amount,
    });
    return res.data;
  },

  getRecentTransactions: async (): Promise<TransactionItem[]> => {
    const res = await apiClient.get<TransactionItem[]>("/wallet/recenttransactions");
    return res.data;
  },
};
