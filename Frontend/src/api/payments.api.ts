import apiClient from "./client";

export const paymentsApi = {
  initializePayment: (data: any) =>
    apiClient.post("/api/billing/payment/initialize", data).then((r) => r.data),

  verifyPayment: (reference: string) =>
    apiClient
      .get(`/api/billing/payment/verify?reference=${reference}`)
      .then((r) => r.data),

  getPaymentHistory: () =>
    apiClient.get("/api/billing/payment/history").then((r) => r.data),

  getInvoices: () => apiClient.get("/api/billing/invoices").then((r) => r.data),

  getInvoiceById: (invoiceId: string) =>
    apiClient.get(`/api/billing/invoices/${invoiceId}`).then((r) => r.data),

  downloadInvoice: (invoiceId: string) =>
    apiClient
      .get(`/api/billing/invoices/${invoiceId}/download`, {
        responseType: "blob",
      })
      .then((r) => r.data),

  getSubscriptionStatus: () =>
    apiClient.get("/api/billing/subscription/status").then((r) => r.data),

  updateSubscription: (planId: string) =>
    apiClient
      .post(`/api/billing/subscription/update`, { planId })
      .then((r) => r.data),

  cancelSubscription: () =>
    apiClient.post("/api/billing/subscription/cancel", {}).then((r) => r.data),
};
