import React from "react";
import Sidebar, { type SidebarRole } from "./Sidebar";
import TopBar from "./Topbar";

interface PageLayoutProps {
  children: React.ReactNode;
  showTopBar?: boolean;
  maxWidth?: string;
  contentClassName?: string;
  sidebarRole?: SidebarRole;
}

const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  showTopBar = true,
  maxWidth = "1076px",
  contentClassName = "",
  sidebarRole = "groundcrew",
}) => {
  return (
    <div className="min-h-screen bg-[#F8FAFF] p-6">
      <div className="mx-auto max-w-[1440px] grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        {/* SIDEBAR: sticky */}
        <div className="md:sticky md:top-6 self-start md:h-[calc(100vh-3rem)]">
          <Sidebar role={sidebarRole} />
        </div>

        <div className="flex flex-col gap-8">
          {/* TOPBAR: sticky di luar konten utama */}
          {showTopBar && (
            <div className="sticky top-6 z-50">
              <TopBar sidebarRole={sidebarRole} />
            </div>
          )}

          {/* KONTEN */}
          <main className="relative flex flex-col bg-[#F8FAFF] p-0 overflow-hidden rounded-2xl">
            <div className="flex flex-col gap-8 flex-1 relative z-10">
              <div className={`px-6 py-6 ${contentClassName}`}>
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default PageLayout;
