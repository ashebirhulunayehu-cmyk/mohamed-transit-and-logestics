'use client';
import React, { useEffect } from 'react';
import { useNotificationStore } from '../notification.store';
import { NotificationCategory } from '../notification.types';

export const NotificationsList = () => {
  const { 
    notifications, 
    unreadCount,
    filterTab, 
    setFilterTab, 
    showUnreadOnly, 
    toggleShowUnreadOnly, 
    markAsRead, 
    markAllAsRead,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
  } = useNotificationStore();

  useEffect(() => {
    void fetchNotifications();
    void fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const tabs: ("All" | NotificationCategory)[] = [
    "All", "Service Updates", "Documents", "Approvals", "Payments", "Inspection", "Risk", "Messages", "System"
  ];

  const filteredNotifications = notifications.filter((n) => {
    if (showUnreadOnly && n.isRead) return false;
    if (filterTab !== "All" && n.category !== filterTab) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600">Notification Centre</span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Notifications</h1>
          <p className="text-xs text-slate-500 mt-1">Everything that changed on your cases, documents, approvals and payments.</p>
          <div className="flex items-center space-x-2 mt-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {loading ? "Loading..." : `${unreadCount} unread`}
            </span>
            <span className="text-xs text-slate-400">of {notifications.length} total updates</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={toggleShowUnreadOnly}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-2 ${
              showUnreadOnly 
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs" 
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span>Show unread only</span>
          </button>

          <button 
            onClick={markAllAsRead}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-indigo-500/20 transition-all"
          >
            Mark all as read
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const count = tab === "All" ? notifications.length : notifications.filter(n => n.category === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                filterTab === tab 
                  ? "bg-slate-900 text-white shadow-sm font-semibold" 
                  : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>{tab}</span>
              {count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  filterTab === tab ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications Feed */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 text-sm font-medium">
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs font-medium">
            No notifications available in this category.
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div 
              key={notif.id} 
              onClick={() => {
                // ማሳወቂያውን ሲጫኑ በቀጥታ የተነበበ (Read) እንዲሆን ማድረግ ይቻላል
                if (!notif.isRead) {
                  markAsRead(notif.id);
                }
              }}
              className={`p-5 flex items-start justify-between transition-all cursor-pointer hover:bg-slate-50/70 ${
                !notif.isRead ? "bg-indigo-50/25 border-l-4 border-indigo-600" : ""
              }`}
            >
              <div className="flex items-start space-x-4">
                {/* Icon Box */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 text-sm ${
                  notif.priority === "CRITICAL" 
                    ? "bg-red-50 border-red-200 text-red-600 shadow-xs" 
                    : "bg-slate-50 border-slate-200/80 text-slate-600"
                }`}>
                  {notif.priority === "CRITICAL" ? "⚠️" : "📄"}
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <h3 className="text-xs font-bold text-slate-900">{notif.title}</h3>
                    
                    {notif.priority && (
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider ${
                        notif.priority === "CRITICAL" 
                          ? "bg-red-100 text-red-700 border border-red-200" 
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}>
                        {notif.priority}
                      </span>
                    )}

                    {notif.isNew && (
                      <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold tracking-wider">
                        New
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.description}</p>

                  <div className="flex items-center space-x-2 mt-2.5 text-[11px] text-slate-400 font-medium">
                    <span className="text-indigo-600 font-semibold">{notif.category}</span>
                    <span>·</span>
                    <span>{notif.time}</span>
                    <span>·</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">{notif.referenceId}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {!notif.isRead && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // የካርዱን ክሊክ እንዳይደራረብ ይከላከላል
                    markAsRead(notif.id);
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 shrink-0 ml-4 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all"
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsList;