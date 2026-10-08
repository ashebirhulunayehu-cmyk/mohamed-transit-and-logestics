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
  rolePrivilege: {
    create: "/RolePrivilege/Create",
    getAll: "/RolePrivilege/GetAll",
  },
  account: {
    getProfile: "/Account/GetProfile",
    updateProfile: "/Account/UpdateProfile",
  },
  seeder: {
    seed: "/Seeder/seed",
  },
  assessor: {
    getPendingCustomerApprovals: "/Assessor/GetPendingCustomerApprovals",
    approveCustomer: "/Assessor/ApproveCustomer",
    getPendingServices: "/Assessor/GetPendingServiceReviews",
    getPendingServiceReviews: "/Assessor/GetPendingServiceReviews",
    reviewService: "/Assessor/ReviewService",
    getServicesUnderOversight: "/Assessor/GetServicesUnderOversight",
    addComplianceFeedback: "/Assessor/AddComplianceFeedback",
    getDashboard: "/Assessor/GetDashboard",
    getComplianceIssues: "/Assessor/GetComplianceIssues",
    getAssessmentLogs: "/Assessor/GetAssessmentLogs",
  },
  manager: {
    getDashboard: "/Manager/GetDashboard",
    assignExecutor: "/Manager/AssignExecutor",
    getServiceById: "/Manager/GetServiceById",

    getAllServices: "/Manager/GetAllServices",
    getAllStaff: "/Manager/GetAllStaff",
    getAllCustomers: "/Manager/GetAllCustomers",
    getNotifications: "/Manager/GetNotifications",
  },
  dashboard: {
    view: "/Dashboard/View",
    viewSort: "/Dashboard/ViewSort",
    organization: "/Dashboard/Organization",
    organizationSort: "/Dashboard/OrganizationSort",
  },
  caseExecutor: {
    getDashboard: "/CaseExecutor/GetDashboard",
    getAssignedServiceById: "/CaseExecutor/GetAssignedServiceById",
  },
  dataEncoder: {
    getDashboard: "/DataEncoder/GetDashboard",
    getAllCustomers: "/DataEncoder/GetAllCustomers",
    createCustomer: "/DataEncoder/CreateCustomer",
    updateCustomer: "/DataEncoder/UpdateCustomer",
    createService: "/DataEncoder/Create%20services",
    services: "/DataEncoder/services",
    updateServiceType: (id: string | number) =>
      `/DataEncoder/services/${encodeURIComponent(String(id))}/service-type`,
    submitService: (id: string | number) =>
      `/DataEncoder/services/${encodeURIComponent(String(id))}/submit`,
    uploadServiceDocuments: (id: string | number) =>
      `/DataEncoder/services/${encodeURIComponent(String(id))}/documents`,
  },
  customer: {
    register: "/Customer/Register",
    getProfile: "/Customer/GetProfile",
    updateProfile: "/Customer/UpdateProfile",
    getNotifications: "/Customer/GetNotifications",
    createService: "/Customer/CreateService",
    getMyServices: "/Customer/GetMyServices",
  },
  notification: {
    getUserNotifications: "/Notification/GetUserNotifications",
    getUnreadCount: "/Notification/GetUnreadCount",
    markAsRead: "/Notification/MarkNotificationAsRead",
    markAllAsRead: "/Notification/MarkAllNotificationsAsRead",
    create: "/Notification/CreateNotification",
    sendBulk: "/Notification/SendBulkNotification",
  },
  message: {
    getUserMessages: "/Messaging/GetUserMessages",
    getServiceMessages: "/Messaging/GetServiceMessages",
    getMessageById: "/Messaging/GetMessageById",
    markMessageAsRead: "/Messaging/MarkMessageAsRead",
    getUnreadMessages: "/Messaging/GetUnreadMessages",
    getUnreadCount: "/Messaging/GetUnreadCount",
    sendMessage: "/Messaging/SendMessage",
  },
  document: {
    uploadServiceDocument: "/Document/UploadServiceDocument",
    getServiceDocuments: "/Document/GetServiceDocuments",
    deleteDocument: "/Document/DeleteDocument",
    verifyDocument: "/Document/VerifyDocument",
    downloadDocument: "/Document/DownloadDocument",
    downloadDocuments: "/Document/DownloadDocuments",
  },
  documentMonitoring: {
    getAlerts: "/document-monitoring/alerts",
  },
  shipment: {
    create: "/Shipments/Create",
    assign: "/Shipments/Assign",
    createStageTransport: "/Shipments/CreateStageTransport",
    update: "/Shipments/Update",
    updateStatus: (id?: string | number) => id === undefined || id === null || String(id).trim() === ""
      ? "/Shipments/UpdateStatus"
      : `/Shipments/UpdateStatus/${id}`,
    updateServiceStage: "/Shipments/UpdateServiceStage",
    updateStageStatus: (id?: string | number) => id === undefined || id === null || String(id).trim() === ""
      ? "/Shipments/UpdateStageStatus"
      : `/Shipments/UpdateStageStatus/${id}`,
    updateStageTransport: "/Shipments/UpdateStageTransport",
    uploadDocument: "/Shipments/UploadDocument",
    getStages: "/Shipments/GetStages",
    getAll: "/Shipments/GetAll",
    getById: (id: string | number) => `/Shipments/GetById/${id}`,
    getByImporter: (importerId: string | number) => `/Shipments/GetByImporter/${importerId}`,
    delete: (id: string | number) => `/Shipments/Delete/${id}`,
    deleteStageTransportDocument: (id?: string | number) =>
      id === undefined || id === null || String(id).trim() === ""
        ? "/StageTransport/DeleteDocument"
        : `/StageTransport/DeleteDocument?id=${encodeURIComponent(String(id))}`,
  },
} as const;

export type ApiRouteKey = typeof API_ROUTES;
