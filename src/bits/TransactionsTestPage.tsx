import { Button, Card, Image, List, Stack, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { auth } from "../firebaseClient";
import { signOut } from "firebase/auth";
import { config } from "../config";

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
  }

  function transactionDisplay(trsn: any) {
    return (
      <div key={trsn.transactionID}>
        <Card shadow="sm" withBorder>
          <Stack>
            <Title ta="center" order={3}>
              {trsn.description} • {trsn.direction == "income" ? "" : "-"}£
              {(trsn.amount / 100).toFixed(2)}
            </Title>
            <Text>ID: {trsn.transactionID}</Text>
          </Stack>
        </Card>
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
      <List style={{ height: "18em", overflow: "scroll", padding: "1.5em" }}>
        {transactions?.map((transaction) => transactionDisplay(transaction))}
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
  );
}

export default TransactionsTestPage;
