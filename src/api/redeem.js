// src/api/redeem.js
import api from "./api";

export const redeemCode = async (code) => {
  const { data } = await api.post("/api/redeem", { code });
  return data;
};
