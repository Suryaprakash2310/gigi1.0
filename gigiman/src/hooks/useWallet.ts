import { useEffect, useState } from "react";
import { WalletAPI, TransactionItem } from "@/api/wallet.api";

export const useWallet = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  const fetchBalance = async () => {
    try {
      setLoadingBalance(true);
      const res = await WalletAPI.getBalance();
      setBalance(res.balance);
    } catch (err) {
      console.log("Wallet balance error:", err);
    } finally {
      setLoadingBalance(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoadingTx(true);
      const res = await WalletAPI.getRecentTransactions();
      setTransactions(res || []);
    } catch (err) {
      console.log("Wallet tx error:", err);
    } finally {
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  return {
    balance,
    loadingBalance,
    refreshBalance: fetchBalance,
    transactions,
    loadingTx,
    refreshTransactions: fetchTransactions,
  };
};
