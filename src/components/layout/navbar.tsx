"use client";

import { Bell, Menu, UserCircle } from "lucide-react";

interface NavbarProps {
  user: {
    name?: string | null;
    role?: string | null;
  };
}

export function Navbar({ user }: NavbarProps) {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center md:hidden">
        <button className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 p-2 rounded-md">
          <Menu className="h-6 w-6" />
        </button>
      </div>
      
      <div className="flex-1 flex justify-end items-center gap-4">
        <button className="p-2 text-gray-400 hover:text-gray-500 relative transition-colors">
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          <Bell className="h-5 w-5" />
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-gray-900 leading-none">{user.name || "User"}</div>
            <div className="text-xs text-gray-500 mt-1">{user.role || "Role"}</div>
          </div>
          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
            <UserCircle className="h-6 w-6" />
          </div>
        </div>
      </div>
    </header>
  );
}
