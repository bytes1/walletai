import { GearIcon } from "@radix-ui/react-icons";
import { Flex, IconButton, Text } from "@radix-ui/themes";
import Address from "../Address";
import Link from "next/link";

export default function TopBar() {
  return (
    <Flex
      width="100%"
      justify="between"
      align="center"
      style={{
        position: "relative",
        padding: "1rem",
        backgroundColor: "white",
        borderBottom: "1px solid var(--gray-3)", // Light border for separation
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)", // Subtle shadow for depth
      }}
    >
      {/* Address section */}
      <Flex gap="2" align="center">
        <Address style={{ alignSelf: "center", fontSize: "1rem", fontWeight: "bold" }} />
      </Flex>

      {/* Settings icon with hover effect */}
      <Link href="/settings" passHref>
        <IconButton
          variant="soft"
          size="3"
          style={{
            transition: "transform 0.2s, background-color 0.3s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--gray-2)";
            e.currentTarget.style.transform = "scale(1.1)"; // Slight scale on hover
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <GearIcon />
        </IconButton>
      </Link>

      {/* Optional network status (can be enabled) */}
      {/* <Text
      size="1"
      style={{
        color: "var(--gray-6)",
        position: "absolute",
        top: "2.5rem",
        left: "1.1rem",
      }}
    >
      on Sepolia testnet
    </Text> */}
    </Flex>
  );
}
