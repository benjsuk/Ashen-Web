import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Checkbox,
  Group,
  List,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { auth } from "../firebaseClient";
import { signOut } from "firebase/auth";
import { config } from "../config";
import { generate as randomWord } from "random-words";
import { FaPen, FaTrashCan } from "react-icons/fa6";
import { IoMdTrash } from "react-icons/io";

function TransactionsTestPage({ user }: { user: any }) {
  const [transactions, setTransactions] = useState<any[]>();
  const [checkboxes, setCheckboxes] = useState<Record<string, boolean>>({});
  async function getTransactions() {
    var result;
    const data = await fetch(config.apiUrl + "/transactions", {
      headers: {
        Authorization: "Bearer " + (await user?.getIdToken()),
      },
    });
    result = await data.json();
    console.log(result);
    setTransactions(await result.sort((a: any, b: any) => a.date - b.date));
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
    const transactionDivs = document.getElementsByClassName("transaction");
    for (let index = 0; index < transactionDivs.length; index++) {
      const element = transactionDivs[index];
      console.log(element.className.replace("transaction ", ""));
    }
  }

  async function deleteTransaction(id: string) {
    const transactionDivs = document.getElementsByClassName("transaction");
    for (let index = 0; index < transactionDivs.length; index++) {
      const element = transactionDivs[index] as HTMLElement;
      if (element.className.replace("transaction ", "") == id)
        element.style.display = "none";
    }
    await fetch(config.apiUrl + "/transactions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + (await user?.getIdToken()),
      },
      method: "POST",
      body: JSON.stringify({
        delete: true,
        id: id,
      }),
    });
    await getTransactions();
  }

  function transactionDisplay(trsn: any) {
    return (
      <div
        key={trsn.transactionID}
        className={"transaction " + trsn.transactionID}
        style={{ margin: "0.5em" }}
      >
        <Group w="100%" gap={0}>
          <Checkbox checked={(checkboxes[trsn.transactionID] || false)} onChange={() => {
            setCheckboxes({
              ...checkboxes,
              [trsn.transactionID]: !(checkboxes[trsn.transactionID] || false),
            });
          }} />
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
              <Title ta="center" order={3} maw="60%" style={{ textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}>
                {trsn.description}
              </Title>
              <Badge color="lightgrey" radius="sm" style={{ color: "#555" }}>
                {trsn.category}
              </Badge>
              <Text size="xs">{trsn.date.split("T")[0]}</Text>

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
            radius="md"
            withBorder
            style={{ padding: 0, transform: "scale(0.95)" }}
            className="trsnedit"
          >
            <Group gap="0" align="stretch">
              <ActionIcon
                style={{
                  backgroundColor: "#98eeff",
                  padding: "0.75em",
                }}
                className="hovershadow"
                m="0"
                radius={0}
                size="2.5em"
              >
                <FaPen size="2em" color="#009bba" />
              </ActionIcon>
              <ActionIcon
                style={{
                  backgroundColor: "#ff9898",
                  padding: "0.75em",
                }}
                className="hovershadow"
                m="0"
                radius={0}
                onClick={() => {
                  deleteTransaction(trsn.transactionID);
                }}
                size="2.5em"
              >
                <IoMdTrash size="2em" color="#ba0000" />
              </ActionIcon>
            </Group>
          </Card>
        </Group>
      </div>
    );
  }

  useEffect(() => {
    getTransactions();

  }, []);

  useEffect(() => {
    const any = Object.values(checkboxes).some(Boolean);
    if (any) {
      const itemboxes = document.getElementsByClassName("trsnedit");
      for (let index = 0; index < itemboxes.length; index++) {
        console.log(itemboxes[index]);
        (itemboxes[index] as HTMLElement).classList += " collapsed"
      }
    } else {
      const itemboxes = document.getElementsByClassName("trsnedit");
      for (let index = 0; index < itemboxes.length; index++) {
        console.log(itemboxes[index]);
        (itemboxes[index] as HTMLElement).classList.remove('collapsed')
      }
    }
  }, [checkboxes]);

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
      <Stack style={{ height: "50vh", overflow: "scroll", padding: "1.5em", flexDirection: "column-reverse" }}>
        <div>
        {transactions?.map((transaction) => transactionDisplay(transaction))}</div>
      </Stack>
      <Button
        onClick={async () => {
          makeTransaction(
            Math.floor(Math.random() * 10000),
            "TEST" +
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
