export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5254/api/v1";

export const API_ROUTES = {
  auth: {
    user: {
      create: "/User/Create",
      dbTest: "/User/db-test",
      update: "/User/Update",
      remove: (id: string | number) => `/User/Delete/${id}`,
      delete: (id: string | number) => `/User/Delete/${id}`,
      login: "/User/Login",
      logout: "/User/LogOut",
      getAll: "/User/GetAll",
      getById: (id: string | number) => `/User/GetById/${id}`,
      refreshToken: "/User/RefreshToken",
    },
    password: {
      reset: "/Password/ResetPassword",
      forgot: "/Password/ForgotPassword",
      change: "/Password/ChangePassword",
    },
  },
  roles: {
    create: "/Roles/Create",
    update: "/Roles/Update",
    remove: (id: string | number) => `/Roles/Delete/${id}`,
    getAll: "/Roles/GetAll",
    getById: (id: string | number) => `/Roles/GetById/${id}`,
  },
  assessor: {
    getPendingCustomerApprovals: "/Assessor/GetPendingCustomerApprovals",
    approveCustomer: "/Assessor/ApproveCustomer",
    getPendingServiceReviews: "/Assessor/GetPendingServiceReviews",
    reviewService: "/Assessor/ReviewService",
    getServicesUnderOversight: "/Assessor/GetServicesUnderOversight",
    addComplianceFeedback: "/Assessor/AddComplianceFeedback",
    getDashboard: "/Assessor/GetDashboard",
    getComplianceIssues: "/Assessor/GetComplianceIssues",
  },
  document: {
    uploadServiceDocument: "/Document/UploadServiceDocument",
    getServiceDocuments: "/Document/GetServiceDocuments",
    deleteDocument: "/Document/DeleteDocument",
    verifyDocument: "/Document/VerifyDocument",
    downloadDocument: "/Document/DownloadDocument",
    downloadDocuments: "/Document/DownloadDocuments",
  },
  shipment: {
    create: "/Shipment/Create",
    assign: "/Shipment/Assign",
    createStageTransport: "/Shipment/CreateStageTransport",
    updateStatus: (id: string | number) => `/Shipment/UpdateStatus/${id}`,
    updateServiceStage: "/Shipment/UpdateServiceStage",
    updateStageTransport: "/Shipment/UpdateStageTransport",
    uploadDocument: "/Shipment/UploadDocument",
    getAll: "/Shipment/GetAll",
    getById: (id: string | number) => `/Shipment/GetById/${id}`,
    getByImporter: (importerId: string | number) => `/Shipment/GetByImporter/${importerId}`,
    delete: (id: string | number) => `/Shipment/Delete/${id}`,
  },
} as const;

export type ApiRouteKey = typeof API_ROUTES;
