import {
  Button,
  Center,
  Group,
  PasswordInput,
  Space,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  GoogleAuthProvider,
  OAuthProvider,
} from "firebase/auth";
import { useState } from "react";
import { auth } from "../firebaseClient";
import GoogleLogo from "./GoogleLogo";
import AppleLogo from "./AppleLogo";
import { FaOpenid } from "react-icons/fa6";

const appleProvider = new OAuthProvider("apple.com");
const benJSProvider = new OAuthProvider("oidc.auth.benjs.uk");

function LoginPage({ setLoading }: { setLoading: (b: boolean) => void }) {
  const [signingUp, setSigningUp] = useState<boolean>();

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },

    validate: {
      email: (value) =>
        /^\S+@\S+$/.test(value) || (value as string).includes("benjs.uk")
          ? null
          : "Invalid email",
      password: (value, values) =>
        /^(?=.*\d).{6,}$/.test(value) ||
        (values.email as string).includes("benjs.uk")
          ? null
          : "Invalid password",
    },
  });

  const signUpForm = useForm({
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
    const email = values.email as string;
    if (email.includes("benjs.uk")) {
      method = "benjs";
    }
    if (method == "E&P") {
      try {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        setLoading(false);
      } catch (e) {
        setLoading(false);
        console.log("Sign-in error:", e);
        form.setErrors({ password: "Incorrect Email or Password" });
      }
    } else if (method == "benjs") {
      try {
        await signInWithPopup(auth, benJSProvider);
        setLoading(false);
      } catch (e) {
        setLoading(false);
        console.log("Sign-in error:", e);
        form.setErrors({ password: "Incorrect Email or Password" });
      }
    }
  }

  async function signInWithGoogle() {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      console.log(e);
    } finally {
    }
  }

  async function signInWithApple() {
    try {
      await signInWithPopup(auth, appleProvider);
    } catch (e) {
      console.log(e);
    } finally {
    }
  }

  async function signInWithBenJS() {
    try {
      await signInWithPopup(auth, benJSProvider);
    } catch (e) {
      console.log(e);
    } finally {
    }
  }

  return (
    <Center w="100%">
      <div style={{ width: "25em" }}>
        {signingUp ? (
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

            <Group justify="space-between" mt="md">
              <Button onClick={() => setSigningUp(false)} variant="subtle">
                Log In
              </Button>
              <Button type="submit">Register</Button>
            </Group>
            <Space h="xl" />
            <Button
              fullWidth
              leftSection={<GoogleLogo />}
              variant="outline"
              radius="xl"
              onClick={signInWithGoogle}
            >
              Sign in with Google
            </Button>
            <Space h="sm" />
            <Button
              fullWidth
              leftSection={<AppleLogo />}
              variant="outline"
              radius="xl"
              onClick={signInWithApple}
              className="signInApple"
            >
              Sign in with Apple
            </Button>
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
              <Button onClick={() => setSigningUp(true)} variant="subtle">
                Register
              </Button>
              <Button type="submit">Log In</Button>
            </Group>
            <Space h="xl" />
            <Button
              fullWidth
              leftSection={<GoogleLogo />}
              variant="outline"
              radius="xl"
              onClick={signInWithGoogle}
            >
              Sign in with Google
            </Button>
            <Space h="sm" />
            <Button
              fullWidth
              leftSection={<AppleLogo />}
              variant="outline"
              radius="xl"
              onClick={signInWithApple}
              className="signInApple"
            >
              Sign in with Apple
            </Button>
            <Space h="sm" />
            <Button
              color="orange"
              fullWidth
              leftSection={<FaOpenid />}
              variant="outline"
              radius="xl"
              onClick={signInWithBenJS}
              className="signInBenJS"
            >
              Sign in with Auth.BenJS
            </Button>
          </form>
        )}
      </div>
    </Center>
  );
}

export default LoginPage;
