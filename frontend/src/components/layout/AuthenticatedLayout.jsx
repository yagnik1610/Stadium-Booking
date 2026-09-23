import React, { useState } from 'react';
import UserNavbar from './UserNavbar';
import UserSidebar from './UserSidebar';
import { X } from 'lucide-react';

export default function AuthenticatedLayout({ children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#334155]">
      
      {/* 1. Desktop Fixed Left Sidebar (260px wide, 100vh height, fixed at left: 0, top: 0) */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-[260px] z-40 bg-white border-r border-[#E2E8F0]">
        <UserSidebar />
      </div>

      {/* 2. Mobile Sidebar Slide-out Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-out sidebar container */}
          <div className="fixed inset-y-0 left-0 w-[270px] bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
              <span className="text-xs font-black text-[#172554] tracking-wider uppercase">
                User Workspace
              </span>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <UserSidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Application Shell (Offset by 260px on desktop so content never overlaps sidebar) */}
      <div className="lg:pl-[260px] flex flex-col min-h-screen w-full">
        
        {/* Top Simple Authenticated Header */}
        <UserNavbar onToggleMobileSidebar={() => setMobileSidebarOpen(true)} />

        {/* Primary Page Content: Centered, Controlled Max Width 1400px, 28-32px Padding */}
        <main className="flex-1 w-full max-w-[1420px] mx-auto p-6 sm:p-8 min-w-0 overflow-x-hidden">
          {children}
        </main>

      </div>

    </div>
  );
}
