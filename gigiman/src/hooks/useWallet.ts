import { useContext } from "react";
import { WalletContext } from "@/context/WalletContext";

export const useWallet = () => {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error("useWallet must be used inside WalletProvider");
  }

  return context;
};
