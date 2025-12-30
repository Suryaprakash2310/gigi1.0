export const injectRazorpayData = (
  html: string,
  key: string,
  amount: number,
  orderId: string
) => {
  return html
    .replace("__KEY__", key)
    .replace("__AMOUNT__", String(amount * 100)) // convert rupees → paise
    .replace("__ORDER_ID__", orderId);
};
