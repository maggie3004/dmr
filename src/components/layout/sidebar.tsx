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
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  
  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["Admin", "Supervisor"] },
    { name: "Inventory Form", href: "/inventory-form", icon: ClipboardList, roles: ["Admin", "Supervisor"] },
    { name: "Reports", href: "/reports", icon: BarChart3, roles: ["Admin"] },
    { name: "Manage Users", href: "/users", icon: Users, roles: ["Admin"] },
    { name: "Settings", href: "/settings", icon: Settings, roles: ["Admin", "Supervisor"] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(role));

  return (
    <div className="hidden md:flex md:w-64 md:flex-col bg-white border-r border-gray-200">
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl tracking-tight">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
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
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                    isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"
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
            className="w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-red-500" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
