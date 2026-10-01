import {
  Center,
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
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "./firebaseClient";
import LoginPage from "./bits/LoginPage";
import TransactionsTestPage from "./bits/TransactionsTestPage";
import pkg from "../package.json";

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
      <Stack maw="90vw" w="50em">
        <Title ta="center" style={{ fontSize: "3em", userSelect: "none" }}>
          Ashen
        </Title>
        <Space h="lg" />
        {user?.email == undefined ? (
          <LoginPage setLoading={setLoading} />
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
        }}
        onClick={() => {
          navigator.clipboard.writeText(pkg.version);
        }}
        order={4}
      >
        v{pkg.version}{" "}
      </Title>
      
    </Center>
  );
}

export default App;
