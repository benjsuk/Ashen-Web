import {
  Avatar,
  Center,
  ComboboxPopover,
  Group,
  Loader,
  Space,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import "./App.css";
import "@mantine/core/styles.css";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "./firebaseClient";
import LoginPage from "./bits/LoginPage";
import TransactionsPage from "./bits/TransactionsPage";
import pkg from "../package.json";
import "@mantine/dates/styles.css";
import TransactionsTestPage from "./bits/TransactionsTestPage";
import { config } from "./config";

function App() {
  const [user, setUser] = useState<User>();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user ?? undefined);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  return (
    <Center h="100vh">
      {" "}
      <Stack maw="90vw" w="50em">
        <Space mih="10vh"/>
        <Title
          ta="center"
          style={{ fontSize: "3em", userSelect: "none", height: "7vh" }}
        >
          Ashen
        </Title>
 <Space mih="2vh"/>
        <Space h="lg" />
        {user?.email == undefined ? (
          <div style={{ height: "50vh" }}>
            <LoginPage setLoading={setLoading} />
          </div>
        ) : (
          <TransactionsTestPage user={user} />
        )}
      </Stack>
      <Tooltip label={"Web Release: " + config.releaseName}>
        <Title
          style={{
            position: "fixed",
            bottom: "1em",
            right: "1em",
            userSelect: "none",
            color: "#444",
            fontWeight: "200",
            zIndex: 1000,
          }}
          onClick={() => {
            navigator.clipboard.writeText(pkg.version);
          }}
          order={4}
        >
          v{pkg.version}
        </Title>
      </Tooltip>
      <ComboboxPopover
        data={["Sign Out"]}
        comboboxProps={{ width: 150, position: "bottom-start" }}
        onChange={(value) => {
          if (value == "Sign Out") {
            signOut(auth);
          }
        }}
      >
        <ComboboxPopover.Target>
          <Group
            style={{
              position: "absolute",
              top: "1em",
              left: "1em",
              userSelect: "none",
              color: "#444",
              fontWeight: "200",
              cursor: "pointer",
              display: user ? "" : "none",
              borderRadius: "1em",
              padding: "0.5em",
            }}
            className="main-avatar"
          >
            <Avatar
              size="md"
              radius="xl"
              color="initials"
              name={user?.displayName || undefined}
              src={user?.photoURL}
              style={{
                border: "1px solid #b0b0b0",
              }}
            />
            <Text>{user?.displayName}</Text>
          </Group>
        </ComboboxPopover.Target>
      </ComboboxPopover>
    </Center>
  );
}

export default App;
