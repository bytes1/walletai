import dynamic from "next/dynamic";
// import Chat from "@/components/Chat";
import { Flex, Box } from "@radix-ui/themes";

const HomePage = dynamic(() => import("@/components/HomePage"), { ssr: false });

export default async function Home() {
  return (
    <Flex direction="row" justify="between" align="start" style={{ flexGrow: 1, width: "100%" }}>
  {/* <Box style={{ width: "50%", height:"100%" }}> */}
    <HomePage />
  {/* </Box> */}
  {/* <Box style={{ width: "50%",padding: "16px", height:"100%" }}>
    <Chat />
  </Box> */}
</Flex>

  
  );
}

// backgroundColor: "gray"