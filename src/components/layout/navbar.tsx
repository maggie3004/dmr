"use client";

import { Menu, UserCircle } from "lucide-react";
import { NotificationsDropdown } from "./notifications-dropdown";

interface NavbarProps {
  user: {
    name?: string | null;
    role?: string | null;
  };
  onMenuClick?: () => void;
}

export function Navbar({ user, onMenuClick }: NavbarProps) {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center md:hidden">
        <button 
          onClick={onMenuClick}
          className="text-gray-500 hover:text-gray-900 focus:outline-none p-2 rounded-md transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
      
      <div className="flex-1 flex justify-end items-center gap-4">
        <NotificationsDropdown />
        
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-gray-900 leading-none">{user.name || "User"}</div>
            <div className="text-xs text-gray-500 mt-1">{user.role || "Role"}</div>
          </div>
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
            <UserCircle className="h-5 w-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
