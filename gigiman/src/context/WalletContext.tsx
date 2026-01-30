import React, { createContext, useContext, useEffect, useState } from "react";
import { WalletAPI, TransactionItem } from "@/api/wallet.api";
import AsyncStorage from "@react-native-async-storage/async-storage";

type KycStatus = "NOT_STARTED" | "PENDING" | "VERIFIED";

export interface WalletContextType {
    balance: number | null;
    loadingBalance: boolean;
    transactions: TransactionItem[];
    loadingTx: boolean;
    refreshBalance: () => Promise<void>;
    refreshTransactions: () => Promise<void>;
    kycStatus: "NOT_STARTED" | "PENDING" | "VERIFIED";
    setKycStatus: React.Dispatch<
        React.SetStateAction<"NOT_STARTED" | "PENDING" | "VERIFIED">
    >;
}

export const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [balance, setBalance] = useState<number | null>(null);
    const [loadingBalance, setLoadingBalance] = useState(false);

    const [transactions, setTransactions] = useState<TransactionItem[]>([]);
    const [loadingTx, setLoadingTx] = useState(false);
    const KYC_KEY = "@wallet_kyc_status";

    const [kycStatus, _setKycStatus] = useState<KycStatus>("NOT_STARTED");

    /* LOAD ON APP START */
    useEffect(() => {
        AsyncStorage.getItem(KYC_KEY).then((saved) => {
            if (saved) _setKycStatus(saved as KycStatus);
        });
    }, []);

    /* SAVE WHEN CHANGED */
    const setKycStatus = async (status: KycStatus) => {
        _setKycStatus(status);
        await AsyncStorage.setItem(KYC_KEY, status);
    };

    const refreshBalance = async () => {
        try {
            setLoadingBalance(true);
            const res = await WalletAPI.getBalance();
            setBalance(res.balance);
        } finally {
            setLoadingBalance(false);
        }
    };

    const refreshTransactions = async () => {
        try {
            setLoadingTx(true);
            const res = await WalletAPI.getRecentTransactions();
            setTransactions(res || []);
        } finally {
            setLoadingTx(false);
        }
    };

    useEffect(() => {
        refreshBalance();
        refreshTransactions();
    }, []);

    return (
        <WalletContext.Provider
            value={{
                balance,
                loadingBalance,
                transactions,
                loadingTx,
                kycStatus,
                setKycStatus,
                refreshBalance,
                refreshTransactions,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};
