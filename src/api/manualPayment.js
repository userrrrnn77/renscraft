// src/api/manualPayment.js

import api from "./api";

export const getManualConfig = async () => {
  const { data } = await api.get("/api/payments/manual/config");
  return data;
};

export const createManualOrder = async (packageId) => {
  const { data } = await api.post("/api/payments/manual/create", { packageId });
  return data;
};

// file: File object, name: string, bank: string
export const uploadProof = async (orderId, file, name, bank) => {
  const res = await api.post(
    `/api/payments/manual/${encodeURIComponent(orderId)}/proof`,
    file,
    {
      headers: {
        "Content-Type": file.type,
        "X-Manual-Name": encodeURIComponent(name),
        "X-Manual-Bank": encodeURIComponent(bank),
      },
      maxBodyLength: 6 * 1024 * 1024,
      maxContentLength: 6 * 1024 * 1024,
    },
  );
  return res.data;
};

export const getOrder = async (orderId) => {
  const { data } = await api.get(
    `/api/payments/orders/${encodeURIComponent(orderId)}`,
  );
  return data;
};