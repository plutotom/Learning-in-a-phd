import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { getToken } from "@/lib/auth-server";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlashSRS",
  description: "Spaced repetition flashcard app",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getToken();
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <ConvexClientProvider initialToken={token}>
          <div className="mx-auto max-w-2xl px-4 py-6">{children}</div>
          <Toaster richColors position="bottom-center" />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
