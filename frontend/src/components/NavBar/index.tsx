"use client";

import { Button, Flex } from "@radix-ui/themes";
import { useModal } from "@/providers/ModalProvider";
import { PaperPlaneIcon, CornersIcon } from "@radix-ui/react-icons";
import QrReaderModal from "../QrReaderModal";
import SendTxModal from "../SendTxModal";

export default function NavBar() {
  const { open } = useModal();

  return (
    <Flex
      justify="center"
      direction="column"
      gap="8" // Increased gap for cleaner separation
      style={{
        marginInline: "2rem",
        padding: "1rem 0",
      }}
    >
      <Button
        size="4" // Larger button for better visibility
        variant="outline"
        style={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between", // Even spacing for text and icon
          padding: "0.75rem 1rem",
          borderRadius: "12px", // Rounded corners for modern look
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)", // Soft shadow for depth
          transition: "background 0.3s ease", // Smooth hover effect
        }}
        onClick={() => open(<SendTxModal />)}
      >
        <span style={{ color: "rgba(0, 0, 0, 0.95)" }}>Send</span>
        <PaperPlaneIcon style={{ width: 22, height: 22 }} />
      </Button>

      <Button
        size="4"
        variant="outline"
        style={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1rem",
          borderRadius: "12px",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
          transition: "background 0.3s ease",
        }}
        onClick={() => open(<QrReaderModal />)}
      >
        <span style={{ color: "rgba(0, 0, 0, 0.95)" }}>Connect Account</span>
        <CornersIcon style={{ width: 22, height: 22 }} />
      </Button>
    </Flex>
  );
}
