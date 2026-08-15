import React from "react";

import AdminLayout from "../../components/Adminlayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}