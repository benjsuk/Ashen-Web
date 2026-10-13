import {
  ActionIcon,
  Autocomplete,
  Badge,
  Button,
  Card,
  Center,
  Checkbox,
  Flex,
  Group,
  NumberFormatter,
  NumberInput,
  RollingNumber,
  SegmentedControl,
  Space,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { config } from "../config";
import { generate as randomWord } from "random-words";
import { FaArrowLeft } from "react-icons/fa6";
import { BiPlus } from "react-icons/bi";
import { useForm } from "@mantine/form";
import { DatePickerInput } from "@mantine/dates";
import { CgDebug } from "react-icons/cg";
import { MdOutlineSelectAll } from "react-icons/md";
import { IoMdTrash } from "react-icons/io";
import { TbCheckbox } from "react-icons/tb";
import { RiCheckboxFill, RiCheckboxLine } from "react-icons/ri";

function TransactionsTestPage({ user }: { user: any }) {
  const [transactions, setTransactions] = useState<any[]>();
  const [checkboxes, setCheckboxes] = useState<Record<string, boolean>>({});
  const [anyChecked, setAnyChecked] = useState<boolean>(false);
  const [checkboxShow, setCheckboxShow] = useState<boolean>(false);
  const [addModalShow, setAddModalShow] = useState<boolean>(false);
  const [direction, setDirection] = useState<any>("expense");
  async function getTransactions() {
    var result;
    const data = await fetch(config.apiUrl + "/transactions", {
      headers: {
        Authorization: "Bearer " + (await user?.getIdToken()),
      },
    });
    result = await data.json();
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
    }
  }

  async function deleteTransaction(id: string) {
    const transactionDivs = document.getElementsByClassName("transaction");
    for (let index = 0; index < transactionDivs.length; index++) {
      const element = transactionDivs[index] as HTMLElement;
      if (element.className.replace("transaction ", "") == id) {
        element.style.transform = "scaleY(0)";
        element.style.maxHeight = "0";
      }
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
    setTimeout(async () => {
      await getTransactions();
    }, 501);
  }

  function transactionDisplay(trsn: any) {
    return (
      <div
        key={trsn.transactionID}
        className={"transaction " + trsn.transactionID}
        style={{
          margin: "0.1em",
          transition: "all 0.5s ease",
          maxHeight: "10em",
        }}
      >
        <Group w="100%" gap={0}>
          
          <Card
            withBorder
            style={{
              backgroundColor:
                trsn.direction == "income" ? "rgb(215, 240, 215)" : "",
            }}
            w="100%"
            radius="xs"
            flex={1}
          >
            <Group w="100%" m={0}>
              <Checkbox style={{
                width: checkboxShow ? "1.25rem" : "0",
                minWidth: checkboxShow ? "1.25rem" : "0",
                maxWidth: checkboxShow ? "1.25rem" : "0",
                overflow: "hidden",
                transform: checkboxShow ? "" : "scaleX(0)",
                transition: "width 0.3s ease, min-width 0.3s ease, max-width 0.3s ease, transform 0.5s ease"
              }} 
              checked={checkboxes[trsn.transactionID] ?? false}
              onChange={(event) =>
                setCheckboxes((current) => ({
                  ...current,
                  [trsn.transactionID]: event.target.checked,
                }))
              }
              />
              <Title
                ta="center"
                order={5}
                maw="45%"
                style={{
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                {trsn.description}
              </Title>
              <Badge color="lightgrey" radius="lg" style={{ color: "#555" }}>
                {trsn.category}
              </Badge>
              {/*<Text size="xs">{trsn.date.split("T")[0]}</Text>*/}

              <Title
                style={{
                  marginLeft: "auto",
                  color:
                    trsn.direction == "income" ? "rgb(21, 185, 21)" : "darkred",
                }}
                order={4}
              >
                {trsn.direction == "income" ? "+" : ""}
                <NumberFormatter
                  decimalScale={2}
                  prefix="£ "
                  value={trsn.amount / 100}
                  thousandSeparator
                />
              </Title>
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
        (itemboxes[index] as HTMLElement).classList += " collapsed";
      }
      setAnyChecked(true);
    } else {
      const itemboxes = document.getElementsByClassName("trsnedit");
      for (let index = 0; index < itemboxes.length; index++) {
        (itemboxes[index] as HTMLElement).classList.remove("collapsed");
      }
      setAnyChecked(false);
    }
  }, [checkboxes]);

  function totalDiff() {
    var total = 0;
    for (let index = 0; index < (transactions ?? []).length; index++) {
      const element = (transactions ?? [])[index];
      if (element.direction == "income") {
        total += element.amount;
      } else {
        total -= element.amount;
      }
    }
    return total / 100;
  }

  const newTrsnForm = useForm({
    initialValues: {
      description: "",
      amount: 0,
      category: "",
      date: new Date().toISOString(),
      direction: "expense",
    },

    validate: {
      amount: (value) => (value >= 0 ? null : "Number must be positive."),
    },
  });

  return (
    <>
      <Stack
        style={{
          transform: addModalShow ? "scale(0)" : "",
          height: addModalShow ? "0" : "",
          pointerEvents: addModalShow ? "none" : undefined,
          transition: "all 0.2s ease",
        }}
      >
        <Title order={3} style={{ textAlign: "center" }}>
          Total Diff:{" "}
          <RollingNumber
            value={totalDiff()}
            prefix="£ "
            decimalScale={2}
            animationDuration={350}
            fixedDecimalScale
            thousandSeparator
          />
        </Title>
        <Space h="md" />
        <Flex>
          <Stack
            style={{
              height: "50vh",
              width: "100%",
              padding: "0.5em",
            }}
            gap={0}
          >
            {transactions?.map((transaction) =>
              transactionDisplay(transaction),
            )}
            <Space h="10em" />
          </Stack>
        </Flex>
      </Stack>
      <Center
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, #fff 60%, #fff 100%)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 40%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 40%)",
          zIndex: "2",
          bottom: 0,
          position: "fixed",
          width: "100%",
          left: 0,
          padding: "2em",
        }}
      >
        <ActionIcon
          style={{
            backgroundColor: "#d6d6d6",
            padding: "0.5em",
            transition: "all 0.75s ease",
            zIndex: 3,
          }}
          className="hovershadow"
          m="0"
          onClick={() => {
            if (addModalShow) {
              setAddModalShow(false);
              newTrsnForm.reset();
            }
          }}
          size="3em"
        >
          <FaArrowLeft size="1em" color="#113" />
        </ActionIcon>
        <Space w="md" />
        <ActionIcon
          style={{
            backgroundColor: "#cef89e",
            padding: "0.5em",
            transition: "all 0.75s ease",
            zIndex: 3,
          }}
          className="hovershadow"
          m="0"
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
          size="5em"
        >
          <CgDebug size="2em" color="#113" />
        </ActionIcon>{" "}
        <Space w="md" />{" "}
        <ActionIcon
          style={{
            backgroundColor: "#cef89e",
            padding: "0.5em",
            transition: "all 0.75s ease",
            zIndex: 3,
          }}
          className="hovershadow"
          m="0"
          onClick={() => {
            if (addModalShow) setAddModalShow(false);
            else setAddModalShow(true);
          }}
          size="5em"
        >
          <BiPlus size="2em" color="#113" />
        </ActionIcon><Space w="md" />{" "}
        <ActionIcon
          style={{
            backgroundColor:"#9ee2f8",
            padding: "0.5em",
            transition: "all 0.75s ease",
            zIndex: 3,
            filter:  checkboxShow ? "brightness(0.96)" : undefined,
            transform: checkboxShow ? "scale(1.1)" : undefined
          }}
          className="hovershadow"
          m="0"
          onClick={() => {
            if (checkboxShow) setCheckboxShow(false);
            else setCheckboxShow(true);
          }}
          size="5em"
        >
          {checkboxShow? <RiCheckboxFill size="2em" color="#113" /> : <RiCheckboxLine size="2em" color="#113" />}
        </ActionIcon>
        <Space w="md" />
        <ActionIcon
              style={{
                backgroundColor: "#ff9898",
                padding: "0.6em",
                transition: "all 0.75s ease",
                opacity: anyChecked ? "1" : "0.3",
                pointerEvents: anyChecked ? undefined : "none",
              }}
              disabled={!anyChecked}
              className="hovershadow"
              m="0"
              onClick={() => {
                Object.entries(checkboxes)
                  .filter(([, checked]) => checked)
                  .forEach(([id]) => deleteTransaction(id));
                setCheckboxes({});
                setAnyChecked(false);
              }}
              size="3em"
            >
              <IoMdTrash size="2em" color="#ba0000" />
            </ActionIcon>
      </Center>
      <Stack
        style={{
          transform: !addModalShow ? "scale(0)" : "",
          pointerEvents: !addModalShow ? "none" : undefined,
          transition: "all 0.2s ease",
          height: !addModalShow ? "0" : "",
        }}
      >
        <Center>
          <Stack>
            <form
              onSubmit={newTrsnForm.onSubmit((values) => {
                makeTransaction(
                  Math.abs(values.amount * 100),
                  values.description,
                  new Date(values.date),
                  values.category,
                  direction,
                );
                setAddModalShow(false);
                newTrsnForm.reset();
              })}
            >
              <NumberInput
                key={newTrsnForm.key("amount")}
                {...newTrsnForm.getInputProps("amount")}
                label="Amount"
                withAsterisk
              />
              <SegmentedControl
                data={[
                  { label: "Expense", value: "expense" },
                  { label: "Income", value: "income" },
                ]}
                defaultValue="Expense"
                value={direction}
                onChange={setDirection}
                w="100%"
                mt="0.7em"
              />
              <TextInput
                key={newTrsnForm.key("description")}
                {...newTrsnForm.getInputProps("description")}
                label="Description"
                withAsterisk
              />
              <Autocomplete
                data={[
                  "Eating Out",
                  "Groceries",
                  "Transport",
                  "Fuel",
                  "Rent / Mortgage",
                  "Utilities",
                  "Bills",
                  "Entertainment",
                  "Shopping",
                  "Clothing",
                  "Health",
                  "Gym",
                  "Subscriptions",
                  "Travel",
                  "Pets",
                  "Gifts",
                  "Education",
                  "Insurance",
                  "Coffee",
                  "Alcohol",
                  "Home",
                  "Misc",
                  "Salary",
                  "Freelance",
                  "Side Hustle",
                  "Interest",
                  "Dividends",
                  "Investments",
                  "Refunds",
                  "Other",
                ]}
                key={newTrsnForm.key("category")}
                {...newTrsnForm.getInputProps("category")}
                label="Category"
                withAsterisk
              />

              <DatePickerInput
                key={newTrsnForm.key("date")}
                {...newTrsnForm.getInputProps("date")}
                label="Date"
                withAsterisk
              />
              <Space h="md" />
              <Button type="submit" w="100%">
                Register
              </Button>
            </form>
          </Stack>
        </Center>
      </Stack>
    </>
  );
}

export default TransactionsTestPage;
