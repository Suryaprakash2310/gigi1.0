import React from "react";
import { useWallet } from "@/hooks/useWallet";

import { WalletHomeScreen } from "@/screens/wallet/WalletHomeScreen";
import { WalletKycIntroScreen } from "@/screens/wallet/WalletKycIntroScreen";
import { WalletKycPendingScreen } from "@/screens/wallet/WalletKycPendingScreen";

export const WalletEntryScreen = () => {
  const { kycStatus } = useWallet(); 
  // UI-only for now: "NOT_STARTED" | "PENDING" | "VERIFIED"

  if (kycStatus === "NOT_STARTED") {
    return <WalletKycIntroScreen />;
  }

  if (kycStatus === "PENDING") {
    return <WalletKycPendingScreen />;
  }

  return <WalletHomeScreen />;
};
