import type { Metadata } from "next";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";
import { ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "TECNYCON - Intranet",
  description: "Sistema de gestión empresarial TECNYCON",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <TooltipProvider delayDuration={200}>
          <ToastProvider>
            <AuthGuard>
              {children}
            </AuthGuard>
          </ToastProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}