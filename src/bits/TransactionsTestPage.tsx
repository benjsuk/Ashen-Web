import {
  Badge,
  Button,
  Card,
  Group,
  Image,
  List,
  Space,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { auth } from "../firebaseClient";
import { signOut } from "firebase/auth";
import { config } from "../config";
import { generate as randomWord } from "random-words";
import { FaPen, FaTrash } from "react-icons/fa";

function TransactionsTestPage({ user }: { user: any }) {
  const [transactions, setTransactions] = useState<any[]>();

  async function getTransactions() {
    var result;
    const data = await fetch(config.apiUrl + "/transactions", {
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
    await fetch(config.apiUrl + "/transactions", {
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
    await getTransactions();
  }

  function transactionDisplay(trsn: any) {
    return (
      <div key={trsn.transactionID} style={{ margin: "0.5em" }}>
        <Group w="100%" gap={0}>
          <Card
            shadow="sm"
            withBorder
            style={{
              backgroundColor:
                trsn.direction == "income" ? "rgb(215, 240, 215)" : "",
            }}
            w="100%"
            flex={1}
            m="xs"
          >
            <Group w="100%">
              <Title ta="center" order={3}>
                {trsn.description}
              </Title>
              <Badge color="lightgrey" radius="sm" style={{ color: "#555" }}>
                {trsn.category}
              </Badge>

              <Title
                style={{
                  marginLeft: "auto",
                  color:
                    trsn.direction == "income" ? "rgb(21, 185, 21)" : "darkred",
                }}
                order={4}
              >
                {trsn.direction == "income" ? "+" : ""}£
                {(trsn.amount / 100).toFixed(2)}
              </Title>
            </Group>
          </Card>
          <Card
            shadow="sm"
            withBorder
            style={{
              backgroundColor: "#98eeff",
              padding: "0.75em",
            }}
            className="hovershadow"
            m="xs"
          >
            <FaPen color="#009bba" />
          </Card>
          <Card
            shadow="sm"
            withBorder
            style={{
              backgroundColor: "#ff9898",
              padding: "0.75em",
            }}
            className="hovershadow"
            m="xs"
          >
            <FaTrash color="#ba0000" />
          </Card>
        </Group>
      </div>
    );
  }

  useEffect(() => {
    getTransactions();
  }, []);

  return (
    <Stack>
      <Title order={2}>{user?.email}</Title>
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
      <List style={{ height: "50vh", overflow: "scroll", padding: "1.5em" }}>
        {transactions?.map((transaction) => transactionDisplay(transaction))}
      </List>
      <Button
        onClick={async () => {
          makeTransaction(
            Math.floor(Math.random() * 10000),
            randomWord(Math.floor(Math.random() * 5))
              .toString()
              .replace("[", "")
              .replace("]", "")
              .replace('"', "")
              .replaceAll(",", " "),
            new Date(),
            "TEST",
            Math.floor(Math.random() * 100) > 20 ? "expense" : "income",
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
  );
}

export default TransactionsTestPage;
