import {
  Button,
  Card,
  Center,
  Group,
  List,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import "./App.css";
import "@mantine/core/styles.css";
import { useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "./firebaseClient";

function App() {
  const [user, setUser] = useState<User>();
  const [transactions, setTransactions] = useState<any[]>();

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      email: "",
      password: "",
    },

    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) =>
        /^(?=.*\d).{6,}$/.test(value) ? null : "Invalid password",
    },
  });

  async function signIn(method: string, values: any) {
    if (method == "E&P") {
      try {
        await signInWithEmailAndPassword(auth, values.email, values.password);
      } catch (e) {
        form.setErrors({ password: "Incorrect Email or Password" });
        console.log(form.errors);
      }
    }
  }

  async function getTransactions() {
    var result;
    const data = await fetch("https://api-ashen.benjs.uk/transactions", {
      headers: {
        Authorization: "Bearer " + (await user?.getIdToken()),
      },
    });
    result = await data.json();
    console.log(result);
    setTransactions(await result);
  }

  async function makeTransaction(
    amount: number,
    description: string,
    date: Date,
    category: string,
    direction: string,
  ) {
    await fetch("https://api-ashen.benjs.uk/transactions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + (await user?.getIdToken()),
      },
      method: "POST",
      body: JSON.stringify({
        amount: amount,
        description: description,
        date: date.toISOString(),
        category: category,
        direction: direction,
      }),
    });
  }

  function transactionDisplay(trsn: any){
    return (
      <>
      <Card shadow="sm" withBorder>
        <Stack>
          <Title ta="center" order={3}>{trsn.description} • {trsn.direction == "income" ? "" : "-"}£{trsn.amount}</Title>
          <Text>ID: {trsn.transactionID}</Text>
          </Stack>
      </Card>
      </>
    )
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user ?? undefined);
    });
    return unsubscribe;
  }, []);

  return (
    <Center h="100vh">
      {user?.email == undefined ? (
        <form onSubmit={form.onSubmit((values) => signIn("E&P", values))}>
          <TextInput
            withAsterisk
            label="Email"
            placeholder="your@email.com"
            key={form.key("email")}
            {...form.getInputProps("email")}
          />
          <PasswordInput
            withAsterisk
            label="Password"
            key={form.key("password")}
            {...form.getInputProps("password")}
          />

          <Group justify="flex-end" mt="md">
            <Button type="submit">Submit</Button>
          </Group>
        </form>
      ) : (
        <Stack>
          <Title>{user?.email}</Title>
          <List>
            <List.Item>UID: {user?.uid}</List.Item>
            <List.Item>Name: {user?.displayName}</List.Item>
          </List>
          <Button
            onClick={async () => {
              getTransactions();
            }}
          >
            Pull Transactions
          </Button>
          <List>
            {transactions?.map((transaction) => (
              transactionDisplay(transaction)
            ))}
          </List>
          <Button
            onClick={async () => {
              makeTransaction(
                Math.floor(Math.random() * 100),
                "TEST",
                new Date(),
                "TEST",
                 Math.floor(Math.random() * 100) > 50 ? "expense" : "income",
              );
            }}
          >
            Make Test Transaction
          </Button>
          <Button
            onClick={async () => {
              await signOut(auth);
            }}
          >
            Sign Out
          </Button>
        </Stack>
      )}
    </Center>
  );
}

export default App;
