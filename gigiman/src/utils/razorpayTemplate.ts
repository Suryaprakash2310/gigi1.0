export const razorpayHTML = `
<html>
  <body>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

    <script>
      const options = {
        key: "__KEY__",
        amount: "__AMOUNT__",
        currency: "INR",
        name: "Gigiman Wallet",
        description: "Add money to wallet",
        order_id: "__ORDER_ID__",
        theme: { color: "#0D47A1" },

        handler: function (response) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            success: true,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          }));
        },

        modal: {
          ondismiss: function () {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              success: false,
              message: "Payment Cancelled"
            }));
          }
        }
      };

      var rzp1 = new Razorpay(options);
      rzp1.open();
    </script>
  </body>
</html>
`;
