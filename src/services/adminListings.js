import api from "@/services/api";

export async function fetchListings(params) {
  const { data } = await api.get("/admin/listings", { params });
  return data; // { items, nextCursor }
}

export async function createListing(payload) {
  const { data } = await api.post("/admin/listings", payload);
  return data;
}

export async function updateListing(id, payload) {
  const { data } = await api.patch(`/admin/listings/${id}`, payload);
  return data;
}

export async function deleteListing(id) {
  const { data } = await api.delete(`/admin/listings/${id}`);
  return data;
}

export async function setListingStatus(id, status) {
  const { data } = await api.patch(`/admin/listings/${id}`, { status });
  return data;
}
