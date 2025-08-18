"use client";

import OnBoarding from "@/components/OnBoarding";
import { useMe } from "@/providers/MeProvider";
import { Button, Flex, Heading, IconButton, Tooltip, Separator } from "@radix-ui/themes";
import { Text } from "@radix-ui/themes";
import { ArrowLeftIcon, AvatarIcon } from "@radix-ui/react-icons";
import ThemeButton from "../ThemeButton";
import Link from "next/link";
import { useWalletConnect } from "@/libs/wallet-connect";
import SessionCard from "../SessionCard";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { me, disconnect, isMounted } = useMe();
  const { sessions } = useWalletConnect();
  const [isCopied, setIsCopied] = useState(false);
  const router = useRouter();

  if (!isMounted) return null;

  if (me) {
    return (
      <Flex direction="column" width="100%" align="start" gap="6" style={{ padding: "1rem" }}>
        {/* Header section */}
        <Flex justify="between" width="100%" align="center">
          <Link href="/">
            <IconButton
              variant="soft"
              size="3"
              style={{
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <ArrowLeftIcon />
            </IconButton>
          </Link>
          {/* Optional theme switch button */}
          {/* <ThemeButton /> */}
        </Flex>

        {/* Settings title */}
        <Heading as="h1" size="8" style={{ textAlign: "center", color: "rgba(0, 0, 0, 0.95)" }}>
          Settings
        </Heading>

        {/* Account and logout section */}
        <Flex direction="column" width="100%" align="start" gap="4">
          <Flex align="center" justify="between" width="100%" gap="2">
            <Tooltip content="Copied!" open={isCopied}>
              <Button
                size="3"
                variant="soft"
                onClick={() => {
                  navigator.clipboard.writeText(me?.account || "");
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 1000);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  borderRadius: "8px",
                }}
              >
                <AvatarIcon />
                <Text weight="bold">
                  {me?.account.slice(0, 6)}...{me?.account.slice(-4)}
                </Text>
              </Button>
            </Tooltip>
            <Button
              size="3"
              onClick={() => {
                disconnect();
                router.push("/");
              }}
              style={{ width: "110px", borderRadius: "8px" }}
              color="red"
              variant="outline"
            >
              LOG OUT
            </Button>
          </Flex>
        </Flex>

        <Separator style={{ width: "100%" }} />

        {/* Wallet Connect Sessions */}
        <Flex direction="column" width="100%" align="start" gap="2">
          <Heading as="h2" style={{ marginBottom: "0.5rem" }}>
            Wallet Connect
          </Heading>

          {!sessions || Object.values(sessions).length < 1 ? (
            <Text>No active dApp sessions</Text>
          ) : (
            Object.values(sessions).map((element) => (
              <SessionCard key={element.session.topic} wcReactSession={element} />
            ))
          )}
        </Flex>
      </Flex>
    );
  } else {
    return <OnBoarding />;
  }
}
