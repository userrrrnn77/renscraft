// src/api/referral.js
//
// Thin wrapper over GET /api/referral/me. The code is created lazily on the
// server side, so this endpoint always returns a usable code for the caller.

import api from "./api";

const REFERRAL_CODE_RE = /^RNS-[A-HJ-NP-Z2-9]{6}$/i;

export const normalizeReferralCode = (raw) => {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  return REFERRAL_CODE_RE.test(code) ? code : null;
};

export const getMyReferral = async () => {
  const { data } = await api.get("/api/referral/me");
  return data;
};
