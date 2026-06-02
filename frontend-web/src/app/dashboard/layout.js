"use client";

export default function RootDashboardLayout({ children }) {
  // We no longer manage layout based on role here.
  // The layout logic is moved to /dashboard/kepsek/layout.js and /dashboard/guru/layout.js
  // This file just serves as a transparent wrapper for the /dashboard route segment.
  return <>{children}</>;
}
