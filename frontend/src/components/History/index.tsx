"use client";

import { Button, Flex, Callout } from "@radix-ui/themes";
import { useMe } from "@/providers/MeProvider";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import LogoAnimatedLight from "../LogoAnimatedLight";

export default function History() {
  const { me } = useMe();

  return (
    <Callout.Root
      style={{
        marginTop: "var(--space-4)",
        padding: "1rem",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Flex direction="row" gap="2" justify="between" align="center">
        <Button
          size="3"
          variant="outline"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.6rem 1.2rem",
            borderRadius: "8px",
            transition: "background-color 0.3s, transform 0.2s",
          }}
          onClick={() => {
            window.open(`https://sepolia.swellchainscan.io/address/${me?.account}`, "_blank");
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f8ff")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
        >
          <span>Browse history on crossfi</span>
          <ArrowRightIcon
            style={{
              transition: "transform 0.2s",
            }}
          />
        </Button>
      </Flex>
    </Callout.Root>
  );
}
