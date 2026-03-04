import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neyesem Admin | Yönetim Paneli",
  description: "Neyesem mobil uygulaması için profesyonel yönetim ve analiz paneli.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full" style={{ background: '#0d0d18' }}>
      <body className="h-full antialiased" style={{
        background: 'linear-gradient(135deg, #0d0d18 0%, #0f0f20 50%, #100a1a 100%)',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
      }}>
        <div className="flex h-full">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <TopNav />
            <main className="flex-1 overflow-x-hidden overflow-y-auto pb-20">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

