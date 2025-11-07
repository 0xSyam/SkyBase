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
  contentClassName = "",
  sidebarRole = "groundcrew",
}) => {
  return (
    <div className="min-h-screen bg-[#F8FAFF] p-4 md:p-6">
      <div className="mx-auto max-w-[1440px] grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 md:gap-6">
        <div className="hidden md:block md:sticky md:top-6 self-start md:h-[calc(100vh-3rem)]">
          <Sidebar role={sidebarRole} />
        </div>

        <div className="flex flex-col gap-8">
          {showTopBar && (
            <div className="sticky top-4 md:top-6 z-50">
              <TopBar sidebarRole={sidebarRole} />
            </div>
          )}

          <main className="relative flex flex-col bg-[#F8FAFF] p-0 overflow-hidden rounded-2xl">
            <div className="flex flex-col gap-6 md:gap-8 flex-1 relative z-10">
              <div className={`px-4 md:px-6 py-4 md:py-6 ${contentClassName}`}>
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
