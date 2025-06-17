
import type { Metadata } from "next";
import { logoutAction } from "../actions";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "Dashboard de Configuração",
  description: "Gerencie seus quizzes e configurações.",
};

// Server action can be defined here and passed or imported directly if 'use server' is in actions.ts
async function handleLogout() {
    "use server";
    await logoutAction();
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell logoutAction={handleLogout}>
      {children}
    </DashboardShell>
  );
}
