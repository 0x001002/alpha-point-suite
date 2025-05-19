import type { Metadata } from "next";

import './globals.css';
import ContextProvider from '@/context'

export const metadata: Metadata = {
  title: "Alpha Point",
  description: "Track BSC Swaps for Zero Slippage Execution",
  icons:{
    icon: "/logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body>
        <ContextProvider>{children}</ContextProvider>
      </body>
    </html>
  );
}
