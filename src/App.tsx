import {
  Center,
  Loader,
} from "@mantine/core";
import "./App.css";
import "@mantine/core/styles.css";
import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
} from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "./firebaseClient";
import LoginPage from "./bits/LoginPage"
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
      {user?.email == undefined ? (
        <LoginPage setLoading={setLoading}/>
      ) : (
        <TransactionsTestPage user={user}/>
      )}
    </Center>
  );
}

export default App;
