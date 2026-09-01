const config: {
  base_url: {
    base: string;
    dev: string;
    pro: string;
    test: string;
  };
  result_code: number | string;
  default_headers: string;
  request_timeout: number;
} = {
  /**
   * api base url - /api/v1 ተጨምሯል
   */
  base_url: {
    base: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5254/api/v1",

    dev: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5254/api/v1",

    pro: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5254/api/v1",

    test: "http://localhost:5254/api/v1",
  },

  /**
   * Status code
   */
  result_code: "0000",

  /**
   * request timeout
   */
  request_timeout: 60000,

  /**
   * header type
   */
  default_headers: "application/json",
};

export { config };