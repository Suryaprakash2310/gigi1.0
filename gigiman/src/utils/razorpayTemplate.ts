export const razorpayHTML = `
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  </head>
  <body>
    <button id="payBtn" style="
      margin-top:40%;
      width:80%;
      height:50px;
      font-size:18px;
    ">
      Pay Now
    </button>

    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

    <script>
      document.getElementById("payBtn").onclick = function () {
        var options = {
          key: "__KEY__",
          amount: "__AMOUNT__",
          currency: "INR",
          name: "Gigiman Wallet",
          description: "Add money to wallet",
          order_id: "__ORDER_ID__",

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
                success: false
              }));
            }
          }
        };

        var rzp1 = new Razorpay(options);
        rzp1.open();
      };
    </script>
  </body>
</html>
`;
