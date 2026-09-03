import { FirebaseAuthTypes } from '@react-native-firebase/auth';

let confirmationResult: FirebaseAuthTypes.ConfirmationResult | null = null;

export const setConfirmationResult = (result: FirebaseAuthTypes.ConfirmationResult | null) => {
  confirmationResult = result;
};

export const getConfirmationResult = (): FirebaseAuthTypes.ConfirmationResult | null => {
  return confirmationResult;
};
