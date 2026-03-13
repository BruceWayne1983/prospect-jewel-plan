import {
  LayoutDashboard, Search, Kanban, Map, UserCircle, CalendarDays, BarChart3, Settings
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Prospect Finder", url: "/prospects", icon: Search },
  { title: "Pipeline", url: "/pipeline", icon: Kanban },
  { title: "Territory Map", url: "/map", icon: Map },
  { title: "Account Planner", url: "/planner", icon: CalendarDays },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center">
              <span className="text-xs font-bold text-sidebar-background">N</span>
            </div>
            <div>
              <h2 className="text-sm font-display font-semibold text-sidebar-accent-foreground">Nomination</h2>
              <p className="text-[10px] text-sidebar-foreground">Territory Planner</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center mx-auto">
            <span className="text-xs font-bold text-sidebar-background">N</span>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-[10px] font-semibold text-sidebar-accent-foreground">EG</span>
            </div>
            <div>
              <p className="text-xs text-sidebar-accent-foreground">Emma-Louise</p>
              <p className="text-[10px] text-sidebar-foreground">South West UK</p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
