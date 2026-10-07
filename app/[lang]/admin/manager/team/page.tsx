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

export default function TeamPage() {
  return (
    <ManagementTablePage
      title="Manager Management"
      searchPlaceholder="Search manager users..."
      columns={columns}
      emptyMessage="No data"
    />
  );
}
