import {
  LayoutDashboard, Search, Kanban, Map, CalendarDays, BarChart3, Settings, Brain, Radar, FlaskConical, Calendar, TrendingUp, FolderOpen, Store
} from "lucide-react";
import nominationLogo from "@/assets/nomination-logo.webp";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "AI Intelligence", url: "/intelligence", icon: Brain },
  { title: "Discovery Engine", url: "/discovery", icon: Radar },
  { title: "Prospect Finder", url: "/prospects", icon: Search },
  { title: "Pipeline", url: "/pipeline", icon: Kanban },
  { title: "Current Accounts", url: "/accounts", icon: Store },
  { title: "Territory Map", url: "/map", icon: Map },
  { title: "Sales Calendar", url: "/calendar", icon: Calendar },
  { title: "Sales Forecast", url: "/forecast", icon: TrendingUp },
  { title: "Strategy Simulator", url: "/simulator", icon: FlaskConical },
  { title: "Account Planner", url: "/planner", icon: CalendarDays },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Data Hub", url: "/data-hub", icon: FolderOpen },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-5 pb-4">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <img src={nominationLogo} alt="Nomination Italy" className="h-9 w-auto object-contain" />
            <div>
              <p className="text-xs font-semibold text-sidebar-foreground tracking-wide">Brioso</p>
              <p className="text-[9px] text-sidebar-foreground/50 tracking-widest uppercase">Nomination · AI Prospecting</p>
            </div>
          </div>
        ) : (
          <img src={nominationLogo} alt="Nomination Italy" className="h-8 w-auto object-contain mx-auto" />
        )}
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/40 text-[9px] uppercase tracking-[0.2em] px-3 mb-1">Menu</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/80 transition-all duration-200 rounded-lg py-2.5"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2.5 h-4 w-4" strokeWidth={1.5} />
                      {!collapsed && <span className="text-[13px]">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && <div className="mx-3 my-3 divider-gold opacity-30" />}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/settings"
                    className="text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/80 transition-all duration-200 rounded-lg py-2.5"
                    activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                  >
                    <Settings className="mr-2.5 h-4 w-4" strokeWidth={1.5} />
                    {!collapsed && <span className="text-[13px]">Settings</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed ? (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/40">
            <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center shadow-sm">
              <span className="text-[10px] font-semibold text-sidebar-background">EG</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-sidebar-accent-foreground truncate">Emma-Louise Gregory</p>
              <p className="text-[10px] text-sidebar-foreground">South West & South Wales</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center mx-auto shadow-sm">
            <span className="text-[10px] font-semibold text-sidebar-background">EG</span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
