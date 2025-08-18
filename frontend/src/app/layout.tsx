import "@radix-ui/themes/styles.css";
import "./globals.css";
import { Theme } from "@radix-ui/themes";
import ThemeProvider from "@/providers/ThemeProvider";
import { WalletConnectProvider } from "@/libs/wallet-connect";
import { SmartWalletProvider } from "@/libs/smart-wallet/SmartWalletProvider";
import { ModalProvider } from "@/providers/ModalProvider";
import { BalanceProvider } from "@/providers/BalanceProvider";
import { MeProvider } from "@/providers/MeProvider";
import { Metadata } from "next";
import { ModalOnWCEvent } from "@/libs/wallet-connect/ModalOnWCEvent";

export const metadata: Metadata = {
  title: "WALLETAI",
  description:
    "passwallet is an account abstraction wallet that allows users to onboard with just a few simple clicks.",
  viewport: {
    width: "device-width",
    height: "device-height",
    initialScale: 1,
    minimumScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

const css = {
  padding: "1rem",
  flexGrow: 1,
  flexBasis: "100%",
  display: "flex",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <MeProvider>
          <BalanceProvider>
            <SmartWalletProvider>
              <WalletConnectProvider>
                <ThemeProvider>
                  <Theme style={css} radius={"full"} accentColor={"teal"}>
                    <ModalProvider>
                      <ModalOnWCEvent>{children}</ModalOnWCEvent>
                    </ModalProvider>
                  </Theme>
                </ThemeProvider>
              </WalletConnectProvider>
            </SmartWalletProvider>
          </BalanceProvider>
        </MeProvider>
      </body>
    </html>
  );
}
