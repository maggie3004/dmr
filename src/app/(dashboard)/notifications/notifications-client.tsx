"use client";

import { useState } from "react";
import { NotificationType } from "@/app/actions/notifications";
import { Bell, CheckCheck, Info, Search, ArrowRight, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";

function formatDistanceToNow(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `Just now`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}

export function NotificationsClient({ initialNotifications }: { initialNotifications: NotificationType[] }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationType[]>(initialNotifications);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notification: NotificationType) => {
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
    router.push(notification.link);
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesTab = activeTab === "all" || !n.read;
    const matchesSearch = 
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === "all" 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab("unread")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === "unread" 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
              <Bell className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No notifications found</h3>
            <p className="text-sm text-gray-500 max-w-sm mt-1">
              {searchTerm ? "No notifications match your search criteria." : "You're all caught up! New alerts will appear here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md border ${
                !notification.read ? "border-blue-200 bg-blue-50/30" : "border-gray-200/80 bg-white"
              }`}
            >
              <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className={`mt-0.5 h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    !notification.read ? "bg-blue-100 text-blue-600 border border-blue-200" : "bg-gray-100 text-gray-500"
                  }`}>
                    <Info className="h-5 w-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-gray-900">{notification.title}</h4>
                      {!notification.read && (
                        <Badge className="bg-blue-600 hover:bg-blue-600 text-[10px] px-2 py-0">New</Badge>
                      )}
                      {notification.category && (
                        <Badge variant="outline" className="text-[10px] text-gray-500 font-normal">
                          {notification.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{notification.description}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 pt-1 font-medium">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(notification.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-gray-400 group-hover:text-blue-600 transition-colors pt-1">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
