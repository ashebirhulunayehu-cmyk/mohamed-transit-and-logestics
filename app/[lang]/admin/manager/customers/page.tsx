"use client";

import { ManagementTablePage } from "@/components/manager/ManagementTablePage";

const columns = [
  "Username",
  "First Name",
  "Last Name",
  "Email",
  "Phone",
  "Status",
  "Options",
];

export default function CustomerManagementPage() {
  return (
    <ManagementTablePage
      title="Customer Management"
      searchPlaceholder="Search customer users..."
      columns={columns}
      emptyMessage="No data"
    />
  );
}
