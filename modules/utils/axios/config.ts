export const config = {
  base_url: {
    base: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5254/api/v1", // 👈 /v1 መጨመሩን አረጋግጥ
  },
  request_timeout: 10000,
  default_headers: "application/json",
};