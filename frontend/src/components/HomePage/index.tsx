"use client";

import OnBoarding from "@/components/OnBoarding";
import { useMe } from "@/providers/MeProvider";
import { Flex } from "@radix-ui/themes";
import Balance from "../Balance";
import NavBar from "../NavBar";
import History from "../History";
import TopBar from "../TopBar";
import LogoAnimated from "../LogoAnimated";
import bgImage from "../../assets/bg.jpeg";
import Chat from "@/components/Chat";
import {  Box } from "@radix-ui/themes";
export default function Home() {
  const { me, isMounted } = useMe();
  if (!isMounted) return null;

  if (me) {
    return (
    
      <Flex direction="row" justify="between" align="start" style={{ flexGrow: 1, width: "100%" }}>
      <Box style={{ width: "50%", height:"100%" }}>
      
      <Flex direction="column" width="100%">
        <TopBar />
        <Balance />
        <NavBar />
      </Flex>
      <History />
   
      </Box>
      <Box style={{ width: "50%",padding: "16px", height:"100%" }}>
        <Chat />
      </Box>
    </Flex>

    );
  } else {
    return <OnBoarding />;
  }
}
