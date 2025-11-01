import api from "@/services/api";

export async function fetchPayments(params = {}) {
  const { data } = await api.get("/admin/payments", { params });
  return data; // shape: { items, total, ... }
}

// Capture an authorized payment
export async function capturePayment(paymentId) {
  const { data } = await api.post(`/admin/payments/${paymentId}/capture`);
  return data; // captured payment payload
}

// Mark a payout as paid
export async function markPayoutPaid(payoutId) {
  const { data } = await api.post(`/admin/payouts/${payoutId}/mark-paid`);
  return data; // updated payout payload
}

// (optional) Refund a payment
export async function refundPayment(paymentId, amount) {
  const { data } = await api.post(`/admin/payments/${paymentId}/refund`, { amount });
  return data;
}
