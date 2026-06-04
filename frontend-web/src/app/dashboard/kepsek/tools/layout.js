// Tools sub-layout — sidebar sudah disediakan oleh parent layout /dashboard/kepsek/layout.js
// File ini hanya sebagai transparent wrapper agar Next.js tidak me-render ulang KepsekLayout
export default function ToolsLayout({ children }) {
  return <>{children}</>;
}
