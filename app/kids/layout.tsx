// Barnesiden (kiosk på delt iPad). Temaet og skriftene kommer fra rot-layouten;
// theme-light gir bare bakgrunn på hele flaten.
export default function KidsLayout({ children }: { children: React.ReactNode }) {
  return <div className="theme-light min-h-screen antialiased">{children}</div>;
}
