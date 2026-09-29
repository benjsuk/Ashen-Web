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
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateCurrentUser,
} from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "./firebaseClient";

function App() {
  const [user, setUser] = useState<User>();
  const [transactions, setTransactions] = useState<any[]>();
  const [signingUp, setSigningUp] = useState<boolean>();

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

  const signUpForm = useForm({
    mode: "uncontrolled",
    initialValues: {
      name: "",
      email: "",
      confemail: "",
      password: "",
    },

    validate: {
      name: (value) => (value != "" ? null : "Enter name"),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      confemail: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) =>
        /^(?=.*\d).{6,}$/.test(value) ? null : "Invalid password",
    },
  });

  async function signUp(values: any) {
    if (values.email.toString() != values.confemail.toString()) {
      signUpForm.setErrors({
        email: "Emails must match",
        confemail: "Emails must match",
      });
    } else {
      console.log(values);
    }

    try {
      await createUserWithEmailAndPassword(auth, values.email, values.password);
      await signInWithEmailAndPassword(auth, values.email, values.password);
      user?.displayName == values.name;
      await updateCurrentUser(auth, user ?? null);
      await signInWithEmailAndPassword(auth, values.email, values.password);
    } catch (e) {}
  }

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

  function transactionDisplay(trsn: any) {
    return (
      <>
        <Card shadow="sm" withBorder>
          <Stack>
            <Title ta="center" order={3}>
              {trsn.description} • {trsn.direction == "income" ? "" : "-"}£
              {(trsn.amount / 100).toFixed(2)}
            </Title>
            <Text>ID: {trsn.transactionID}</Text>
          </Stack>
        </Card>
      </>
    );
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
        signingUp ? (
          <form onSubmit={signUpForm.onSubmit((values) => signUp(values))}>
            <TextInput
              withAsterisk
              label="Your Name"
              placeholder="John Smith"
              key={signUpForm.key("name")}
              {...signUpForm.getInputProps("name")}
            />
            <TextInput
              withAsterisk
              label="Email"
              placeholder="your@email.com"
              key={signUpForm.key("email")}
              {...signUpForm.getInputProps("email")}
            />
            <TextInput
              withAsterisk
              label="Confirm Email"
              placeholder="your@email.com"
              key={signUpForm.key("confemail")}
              {...signUpForm.getInputProps("confemail")}
            />
            <PasswordInput
              withAsterisk
              label="Password"
              key={signUpForm.key("password")}
              {...signUpForm.getInputProps("password")}
            />

            <Group justify="space-between" mt="md" maw="100%">
              <Button w="45%" onClick={() => setSigningUp(false)}>
                Log In
              </Button>
              <Button w="45%" type="submit">
                Submit
              </Button>
            </Group>
          </form>
        ) : (
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

            <Group justify="space-between" mt="md">
              <Button onClick={() => setSigningUp(true)}>Sign Up</Button>
              <Button type="submit">Submit</Button>
            </Group>
          </form>
        )
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
            {transactions?.map((transaction) =>
              transactionDisplay(transaction),
            )}
          </List>
          <Button
            onClick={async () => {
              makeTransaction(
                Math.floor(Math.random() * 10000),
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
