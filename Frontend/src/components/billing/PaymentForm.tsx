import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { paymentsApi } from "../../api/payments.api";
import { CreditCard, DollarSign, Lock } from "lucide-react";

interface Course {
  id: string;
  title: string;
  price: number;
  currency: string;
}

interface PaymentFormProps {
  course?: Course & {
    id: string;
    title: string;
    price: number;
    currency: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  course = { id: "", title: "", price: 0, currency: "USD" },
  onSuccess = () => {},
  onCancel = () => {},
}) => {
  const [paymentMethod, setPaymentMethod] = useState<
    "card" | "paystack" | "flutterwave"
  >("card");
  const [cardData, setCardData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    holderName: "",
  });
  const [email, setEmail] = useState("");

  const initializePaymentMutation = useMutation({
    mutationFn: () =>
      paymentsApi.initializePayment({
        courseId: course.id,
        amount: course.price,
        paymentMethod,
        email,
        cardData: paymentMethod === "card" ? cardData : undefined,
      }),
    onSuccess: (data) => {
      if (data.paymentUrl) {
        window.open(data.paymentUrl, "_blank");
      }
      onSuccess();
    },
  });

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    initializePaymentMutation.mutate();
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Secure Payment
        </h2>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Course</p>
          <p className="text-xl font-bold text-gray-900">{course.title}</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {course.currency} {course.price.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Payment Method
        </label>
        <div className="space-y-2">
          {(["card", "paystack", "flutterwave"] as const).map((method) => (
            <label key={method} className="flex items-center">
              <input
                type="radio"
                name="paymentMethod"
                value={method}
                checked={paymentMethod === method}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="ml-3 text-gray-700 capitalize">{method}</span>
            </label>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
          />
        </div>

        {/* Card Fields (only for card method) */}
        {paymentMethod === "card" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Card Number
              </label>
              <input
                type="text"
                name="cardNumber"
                value={cardData.cardNumber}
                onChange={handleCardChange}
                placeholder="4242 4242 4242 4242"
                maxLength={19}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="text"
                  name="expiryDate"
                  value={cardData.expiryDate}
                  onChange={handleCardChange}
                  placeholder="MM/YY"
                  maxLength={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  CVV
                </label>
                <input
                  type="text"
                  name="cvv"
                  value={cardData.cvv}
                  onChange={handleCardChange}
                  placeholder="123"
                  maxLength={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                name="holderName"
                value={cardData.holderName}
                onChange={handleCardChange}
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {/* Security Note */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
          <Lock className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-green-800">
            Your payment information is encrypted and secure. We never store
            your full card details.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={initializePaymentMutation.isPending || !email}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {initializePaymentMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4" />
                Pay Now
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;
