import apiClient from "./client";

export const initiateMaskedCall = (bookingId: string) => {
  return apiClient.post(`/booking/mask-call/${bookingId}`);
};
