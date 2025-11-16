// src/services/adminPayments.js
import api from "@/services/api";

// List payments (supports filters / pagination via params)
export async function fetchPayments(params = {}) {
  const { data } = await api.get("/admin/payments", { params });
  return data; // { items, total, page, pages }
}

// Capture a PayMongo payment (when you have a real paymentId)
export async function capturePayment(paymentId) {
  const { data } = await api.post(`/admin/payments/${paymentId}/capture`);
  return data; // { message, booking, paymongo }
}

// Refund a payment (full or partial)
export async function refundPayment(paymentId, amount) {
  const { data } = await api.post(`/admin/payments/${paymentId}/refund`, {
    amount,
  });
  return data; // { message, booking, paymongo }
}
