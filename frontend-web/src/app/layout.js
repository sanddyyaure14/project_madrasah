import "./globals.css";

export const metadata = {
  title: "MadrasahAI",
  description: "Aplikasi Asesmen Cerdas",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="antialiased m-0 font-sans">
        {children}
      </body>
    </html>
  );
}