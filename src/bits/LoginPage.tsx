import { Button, Group, PasswordInput, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { useState } from "react";
import { auth } from "../firebaseClient";
function LoginPage({ setLoading }: { setLoading: (b: boolean) => void }) {
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
    setLoading(true);
    if (values.email.toString() != values.confemail.toString()) {
      signUpForm.setErrors({
        email: "Emails must match",
        confemail: "Emails must match",
      });
      return;
    } else {
      console.log(values);
    }

    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password,
      );
      await updateProfile(cred.user, { displayName: values.name });
    } catch (e) {
      setLoading(false);
      signUpForm.setErrors({ password: "There was an error." });
    }
  }

  async function signIn(method: string, values: any) {
    setLoading(true);
    if (method == "E&P") {
      try {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        setLoading(false);
      } catch (e) {
        setLoading(false);
        form.setErrors({ password: "Incorrect Email or Password" });
        console.log(form.errors);
      }
    }
  }

  return signingUp ? (
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
  );
}

export default LoginPage;
