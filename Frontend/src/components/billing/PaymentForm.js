import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { paymentsApi } from "../../api/payments.api";
import { CreditCard, DollarSign, Lock } from "lucide-react";
export const PaymentForm = ({ course = { id: "", title: "", price: 0, currency: "USD" }, onSuccess = () => { }, onCancel = () => { }, }) => {
    const [paymentMethod, setPaymentMethod] = useState("card");
    const [cardData, setCardData] = useState({
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        holderName: "",
    });
    const [email, setEmail] = useState("");
    const initializePaymentMutation = useMutation({
        mutationFn: () => paymentsApi.initializePayment({
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
    const handleCardChange = (e) => {
        const { name, value } = e.target;
        setCardData((prev) => ({ ...prev, [name]: value }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        initializePaymentMutation.mutate();
    };
    return (_jsxs("div", { className: "max-w-md mx-auto bg-white rounded-lg shadow-lg p-6", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Secure Payment" }), _jsxs("div", { className: "bg-blue-50 p-4 rounded-lg", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Course" }), _jsx("p", { className: "text-xl font-bold text-gray-900", children: course.title }), _jsxs("p", { className: "text-2xl font-bold text-blue-600 mt-2", children: [course.currency, " ", course.price.toFixed(2)] })] })] }), _jsxs("div", { className: "mb-6", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-3", children: "Payment Method" }), _jsx("div", { className: "space-y-2", children: ["card", "paystack", "flutterwave"].map((method) => (_jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "radio", name: "paymentMethod", value: method, checked: paymentMethod === method, onChange: (e) => setPaymentMethod(e.target.value), className: "w-4 h-4 text-blue-600" }), _jsx("span", { className: "ml-3 text-gray-700 capitalize", children: method })] }, method))) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Email" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "you@example.com" })] }), paymentMethod === "card" && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2", children: [_jsx(CreditCard, { className: "w-4 h-4" }), "Card Number"] }), _jsx("input", { type: "text", name: "cardNumber", value: cardData.cardNumber, onChange: handleCardChange, placeholder: "4242 4242 4242 4242", maxLength: 19, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Expiry Date" }), _jsx("input", { type: "text", name: "expiryDate", value: cardData.expiryDate, onChange: handleCardChange, placeholder: "MM/YY", maxLength: 5, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2", children: [_jsx(Lock, { className: "w-4 h-4" }), "CVV"] }), _jsx("input", { type: "text", name: "cvv", value: cardData.cvv, onChange: handleCardChange, placeholder: "123", maxLength: 4, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Cardholder Name" }), _jsx("input", { type: "text", name: "holderName", value: cardData.holderName, onChange: handleCardChange, placeholder: "John Doe", className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] })), _jsxs("div", { className: "bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2", children: [_jsx(Lock, { className: "w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" }), _jsx("p", { className: "text-xs text-green-800", children: "Your payment information is encrypted and secure. We never store your full card details." })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { type: "button", onClick: onCancel, className: "flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition", children: "Cancel" }), _jsx("button", { type: "submit", disabled: initializePaymentMutation.isPending || !email, className: "flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2", children: initializePaymentMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white" }), "Processing..."] })) : (_jsxs(_Fragment, { children: [_jsx(DollarSign, { className: "w-4 h-4" }), "Pay Now"] })) })] })] })] }));
};
export default PaymentForm;
