import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#f1f5f9" }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <DashboardHeader />
        <main className="flex-1 p-7 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
