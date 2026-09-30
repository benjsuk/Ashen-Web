import { Center, Loader, Space, Stack, Title } from "@mantine/core";
import "./App.css";
import "@mantine/core/styles.css";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "./firebaseClient";
import LoginPage from "./bits/LoginPage";
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
      <Stack maw="90vw" w="50em">
        <Title ta="center" style={{ fontSize: "3em" }}>
          Ashen
        </Title>
        <Space h="lg" />
        {user?.email == undefined ? (
          <LoginPage setLoading={setLoading} />
        ) : (
          <TransactionsTestPage user={user} />
        )}
      </Stack>
    </Center>
  );
}

export default App;
