import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      {/* pt-14 on mobile to clear the fixed top bar; md:pt-0 removes it on desktop */}
      <main className="flex flex-1 flex-col overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
