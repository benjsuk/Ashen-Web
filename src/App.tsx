import {
  Avatar,
  Center,
  ComboboxPopover,
  Loader,
  Space,
  Stack,
  Title,
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
        <Title
          ta="center"
          style={{ fontSize: "3em", userSelect: "none", height: "15vh" }}
        >
          Ashen
        </Title>

        <Space h="lg" />
        {user?.email == undefined ? (
          <div style={{ height: "50vh" }}>
            <LoginPage setLoading={setLoading} />
          </div>
        ) : (
          <TransactionsTestPage user={user} />
        )}
      </Stack>
      <Title
        style={{
          position: "absolute",
          bottom: "1em",
          right: "1em",
          userSelect: "none",
          color: "#444",
          fontWeight: "200",
        }}
        onClick={() => {
          navigator.clipboard.writeText(pkg.version);
        }}
        order={4}
      >
        v{pkg.version}
      </Title>
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
          <Avatar
            style={{
              position: "absolute",
              top: "1em",
              left: "1em",
              userSelect: "none",
              color: "#444",
              fontWeight: "200",
              cursor: "pointer",
              display: user ? "" : "none",
            }}
            size="md"
            radius="xl"
            className="main-avatar"
            color="initials"
            name={user?.displayName || undefined}
            src={user?.photoURL}
          />
        </ComboboxPopover.Target>
      </ComboboxPopover>
    </Center>
  );
}

export default App;
