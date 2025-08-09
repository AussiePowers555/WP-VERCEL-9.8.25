
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSessionStorage } from "@/hooks/use-session-storage"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
} from "@/components/ui/sidebar"
import {
    Home,
    Briefcase,
    Bike,
    Banknote,
    FileText,
    Gem,
    Settings,
    MessageSquare,
    ClipboardCheck,
    Contact,
    Mail,
    LayoutGrid,
    Shield,
    Users,
} from "lucide-react"

const mainNavItems = [
    { href: "/", label: "Dashboard", icon: Home, adminOnly: true },
    { href: "/workspaces", label: "Workspaces", icon: LayoutGrid, adminOnly: true },
    { href: "/cases", label: "Case Management", icon: Briefcase, adminOnly: true },
    { href: "/fleet", label: "Fleet Tracking", icon: Bike, adminOnly: true },
    { href: "/financials", label: "Financials", icon: Banknote, adminOnly: true },
    { href: "/commitments", label: "Commitments", icon: ClipboardCheck, adminOnly: true },
    { href: "/contacts", label: "Contacts", icon: Contact, adminOnly: true },
    { href: "/documents", label: "Documents", icon: FileText, adminOnly: true },
    { href: "/interactions", label: "Interactions", icon: MessageSquare, adminOnly: false },
    { href: "/ai-email", label: "AI Email", icon: Mail, adminOnly: true },
]

const settingsNavItems = [
    { href: "/admin", label: "Admin Dashboard", icon: Shield, adminOnly: true },
    { href: "/admin/users", label: "User Management", icon: Users, adminOnly: true },
    { href: "/subscriptions", label: "Subscriptions", icon: Gem, adminOnly: true },
    { href: "/settings", label: "Settings", icon: Settings, adminOnly: false },
]

export function Nav() {
    const [currentUser] = useSessionStorage<any>("currentUser", null);
    const { role } = useWorkspace();
    const pathname = usePathname()
    
    // Strictly check if user is admin or developer
    const isAdmin = currentUser?.role === "admin" || currentUser?.role === "developer";
    
    console.log('[Nav Debug]', { 
        userRole: currentUser?.role, 
        isAdmin,
        showingOnlyInteractions: !isAdmin
    });

    const rentalAgreementRegex = /^\/rental-agreement\/.*/;
    const isRentalAgreementPage = rentalAgreementRegex.test(pathname);
    const isFleetPage = pathname.startsWith('/fleet');

    return (
        <div className="flex h-full flex-col glass-sidebar animate-slide-left">
            <SidebarHeader className="border-b border-white/5 p-6">
                <Link href={!isAdmin ? "/interactions" : "/"} className="flex items-center gap-3 group">
                    <div className="icon-container p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Bike className="h-6 w-6 text-blue-300" />
                    </div>
                    <div>
                        <span className="text-xl font-bold text-white">PBikeRescue</span>
                        <p className="text-xs text-gray-400">Fleet Management</p>
                    </div>
                </Link>
            </SidebarHeader>
            <SidebarContent className="flex-1">
                <SidebarMenu>
                    {mainNavItems
                        .filter(item => {
                            // Only show admin items to admins
                            if (item.adminOnly && !isAdmin) {
                                return false;
                            }
                            // For non-admins, ONLY show Interactions
                            if (!isAdmin) {
                                return item.label === 'Interactions';
                            }
                            // Admins see everything
                            return true;
                        })
                        .map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === item.href || (item.href === "/fleet" && isRentalAgreementPage)}
                                className={`rounded-xl transition-all duration-200 hover:bg-white/8 group ${
                                    pathname === item.href ? 'bg-blue-500/15 border border-blue-500/20 text-blue-200' : 'text-gray-300 hover:text-white'
                                }`}
                            >
                                <Link href={item.href} className="flex items-center gap-3 px-4 py-3">
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                    {pathname === item.href && (
                                        <div className="ml-auto w-2 h-2 rounded-full bg-blue-400"></div>
                                    )}
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="border-t border-white/5">
                 <SidebarGroup>
                    <SidebarGroupLabel className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 px-3">Settings</SidebarGroupLabel>
                    <SidebarMenu>
                        {settingsNavItems
                            .filter(item => {
                                // Only admins see admin settings
                                if (item.adminOnly && !isAdmin) {
                                    return false;
                                }
                                // Non-admins only see basic Settings
                                if (!isAdmin) {
                                    return item.label === 'Settings';
                                }
                                // Admins see everything
                                return true;
                            })
                            .map((item) => (
                             <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton 
                                    asChild 
                                    isActive={pathname.startsWith(item.href)}
                                    className={`rounded-xl transition-all duration-200 hover:bg-white/8 group ${
                                        pathname.startsWith(item.href) ? 'bg-purple-500/15 border border-purple-500/20 text-purple-200' : 'text-gray-300 hover:text-white'
                                    }`}
                                >
                                    <Link href={item.href} className="flex items-center gap-3 px-4 py-3">
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-medium">{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarFooter>
        </div>
    )
}
