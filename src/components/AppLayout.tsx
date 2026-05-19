import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const online = useOnlineStatus();
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {!online && (
            <div
              role="status"
              aria-live="polite"
              className="bg-warning/10 border-b border-warning/30 text-warning text-xs px-4 py-2 flex items-center gap-2"
            >
              <WifiOff className="w-3.5 h-3.5" />
              You're offline — changes you make may not save until you're back online.
            </div>
          )}
          <header className="h-14 flex items-center justify-between border-b border-border/30 px-6 bg-card/60 backdrop-blur-md sticky top-0 z-10">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
            <div className="flex items-center gap-3">
              <button className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
                <Bell className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              </button>
              <div className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center shadow-sm">
                <span className="text-[9px] font-semibold" style={{ color: 'hsl(var(--sidebar-background))' }}>EG</span>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
