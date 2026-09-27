import {
  Button,
  Center,
  Group,
  PasswordInput,
  Text,
  TextInput,
} from "@mantine/core";
import "./App.css";
import "@mantine/core/styles.css";
import { useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import type { User } from "firebase/auth"
import { app, auth } from "./firebaseL";

function App() {
  const [user, setUser] = useState<User>(); 

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

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setUser(user ?? undefined);   // user is `User | null` here
    alert("BACON")
  });
  return unsubscribe;
}, []);

  return (
    <Center h="100vh">
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
    </Center>
  );
}

export default App;
