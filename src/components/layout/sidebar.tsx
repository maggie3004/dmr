"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ClipboardList, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut 
} from "lucide-react";
import { signOut } from "next-auth/react";

interface SidebarProps {
  role: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ role, isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  
  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["Admin", "Supervisor"] },
    { name: "New DMR", href: "/inventory-form", icon: ClipboardList, roles: ["Admin", "Supervisor"] },
    { name: "My Entries", href: "/my-entries", icon: ClipboardList, roles: ["Supervisor"] },
    { name: "All Entries", href: "/entries", icon: ClipboardList, roles: ["Admin"] },
    { name: "Reports", href: "/reports", icon: BarChart3, roles: ["Admin"] },
    { name: "Suppliers", href: "/suppliers", icon: Users, roles: ["Admin"] },
    { name: "Materials", href: "/materials", icon: LayoutDashboard, roles: ["Admin"] },
    { name: "Manage Users", href: "/users", icon: Users, roles: ["Admin"] },
    { name: "Settings", href: "/settings", icon: Settings, roles: ["Admin", "Supervisor"] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(role));

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden" 
          onClick={() => setIsOpen(false)} 
        />
      )}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 shadow-xl transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex items-center h-16 px-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-white font-bold text-xl tracking-tight">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white text-sm">DMR</span>
          </div>
          Portal
        </div>
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto pt-5 pb-4">
        <nav className="flex-1 px-4 space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-50"
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                    isActive ? "text-primary-foreground" : "text-slate-500 group-hover:text-slate-300"
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 mt-auto">
          <button
            onClick={() => signOut()}
            className="w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-red-500" />
            Logout
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
