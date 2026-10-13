import {
  ActionIcon,
  Alert,
  Autocomplete,
  Badge,
  Button,
  Card,
  Checkbox,
  Group,
  Loader,
  Modal,
  NumberInput,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import type { User } from "firebase/auth";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaMagnifyingGlass,
  FaPencil,
  FaPlus,
  FaRotate,
  FaTrash,
} from "react-icons/fa6";
import { config } from "../config";

type Direction = "income" | "expense";

type Transaction = {
  transactionID: string;
  amount: number;
  description: string;
  date: string;
  category: string | null;
  direction: Direction;
};

type TransactionFormValues = {
  description: string;
  amount: number | string;
  category: string;
  date: Date | null;
  direction: Direction;
};

type Filter = "all" | Direction;

const categories = [
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
  "Salary",
  "Freelance",
  "Interest",
  "Dividends",
  "Refunds",
  "Other",
];

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
});

function formatCurrency(pence: number) {
  return currencyFormatter.format(pence / 100);
}

function transactionDate(value: string) {
  const datePart = value.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return new Date(value);
}

function transactionDateInput(value: string) {
  const date = transactionDate(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

async function responseError(response: Response) {
  const message = (await response.text()).trim();
  return message || `Request failed (${response.status}).`;
}

function parseTransactions(data: unknown): Transaction[] {
  if (!Array.isArray(data)) {
    throw new Error(
      "The transactions response was not in the expected format.",
    );
  }

  return data.map((item: unknown) => {
    if (typeof item !== "object" || item === null) {
      throw new Error("A transaction in the response was not valid.");
    }
    const transaction = item as Record<string, unknown>;
    if (
      typeof transaction.transactionID !== "string" ||
      typeof transaction.amount !== "number" ||
      !Number.isFinite(transaction.amount) ||
      typeof transaction.description !== "string" ||
      typeof transaction.date !== "string" ||
      (transaction.direction !== "income" &&
        transaction.direction !== "expense")
    ) {
      throw new Error("A transaction in the response was not valid.");
    }

    return {
      transactionID: transaction.transactionID,
      amount: transaction.amount,
      description: transaction.description,
      date: transaction.date,
      category:
        typeof transaction.category === "string" ? transaction.category : null,
      direction: transaction.direction,
    };
  });
}

type TransactionRowProps = {
  transaction: Transaction;
  selected: boolean;
  onToggle: (id: string, checked: boolean) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
};

const TransactionRow = memo(function TransactionRow({
  transaction,
  selected,
  onToggle,
  onEdit,
  onDelete,
}: TransactionRowProps) {
  return (
    <Card
      className={`transaction-card${selected ? " selected" : ""}`}
      withBorder
      radius="md"
      padding="sm"
    >
      <Group wrap="nowrap" align="center">
        <Checkbox
          aria-label={`Select ${transaction.description}`}
          checked={selected}
          onChange={(event) =>
            onToggle(transaction.transactionID, event.target.checked)
          }
        />
        <div
          style={{
            display: "grid",
            placeItems: "center",
            width: 36,
            height: 36,
            flex: "0 0 36px",
            borderRadius: "50%",
            background:
              transaction.direction === "income"
                ? "var(--mantine-color-teal-0)"
                : "var(--mantine-color-gray-1)",
            color:
              transaction.direction === "income"
                ? "var(--mantine-color-teal-8)"
                : "var(--mantine-color-gray-7)",
          }}
          aria-hidden="true"
        >
          {transaction.direction === "income" ? <FaArrowDown /> : <FaArrowUp />}
        </div>
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600} truncate>
            {transaction.description}
          </Text>
          <Group gap="xs" wrap="wrap">
            {transaction.category && (
              <Badge variant="light" color="gray">
                {transaction.category}
              </Badge>
            )}
            <Text c="dimmed" size="xs">
              {dateFormatter.format(transactionDate(transaction.date))}
            </Text>
          </Group>
        </Stack>
        <Text
          fw={600}
          c={transaction.direction === "income" ? "teal.8" : "dark"}
          style={{ whiteSpace: "nowrap" }}
        >
          {transaction.direction === "income" ? "+" : "−"}
          {formatCurrency(transaction.amount)}
        </Text>
        <Group gap={2} wrap="nowrap">
          <ActionIcon
            aria-label={`Edit ${transaction.description}`}
            variant="subtle"
            onClick={() => onEdit(transaction)}
          >
            <FaPencil />
          </ActionIcon>
          <ActionIcon
            aria-label={`Delete ${transaction.description}`}
            color="red"
            variant="subtle"
            onClick={() => onDelete(transaction.transactionID)}
          >
            <FaTrash />
          </ActionIcon>
        </Group>
      </Group>
    </Card>
  );
});

function TransactionsPage({ user }: { user: User }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string[] | null>(
    null,
  );

  const form = useForm<TransactionFormValues>({
    initialValues: {
      description: "",
      amount: "",
      category: "",
      date: new Date(),
      direction: "expense",
    },
    validate: {
      description: (value) => (value.trim() ? null : "Enter a description."),
      amount: (value) =>
        Number(value) > 0 ? null : "Enter an amount greater than zero.",
      date: (value) => (value ? null : "Choose a date."),
    },
  });

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${config.apiUrl}/transactions`, {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      });
      if (!response.ok) {
        throw new Error(await responseError(response));
      }
      const result = parseTransactions(await response.json());
      result.sort(
        (a, b) =>
          transactionDate(b.date).getTime() - transactionDate(a.date).getTime(),
      );
      setTransactions(result);
      setSelected((current) =>
        Object.fromEntries(
          Object.entries(current).filter(([id]) =>
            result.some((transaction) => transaction.transactionID === id),
          ),
        ),
      );
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  const totals = useMemo(
    () =>
      transactions.reduce(
        (result, transaction) => {
          if (transaction.direction === "income") {
            result.income += transaction.amount;
          } else {
            result.expenses += transaction.amount;
          }
          return result;
        },
        { income: 0, expenses: 0 },
      ),
    [transactions],
  );

  const visibleTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return transactions.filter((transaction) => {
      const matchesType = filter === "all" || transaction.direction === filter;
      const matchesQuery =
        !normalizedQuery ||
        `${transaction.description} ${transaction.category ?? ""}`
          .toLocaleLowerCase()
          .includes(normalizedQuery);
      return matchesType && matchesQuery;
    });
  }, [filter, query, transactions]);

  const selectedIds = transactions
    .filter((transaction) => selected[transaction.transactionID])
    .map((transaction) => transaction.transactionID);

  const toggleTransaction = useCallback((id: string, checked: boolean) => {
    setSelected((current) => ({ ...current, [id]: checked }));
  }, []);

  const requestDelete = useCallback((id: string) => {
    setDeleteConfirmation([id]);
  }, []);

  function openNewTransaction() {
    setEditing(null);
    form.reset();
    form.setFieldValue("date", new Date());
    setFormOpen(true);
  }

  const openEditTransaction = useCallback(
    (transaction: Transaction) => {
      setEditing(transaction);
      form.setValues({
        description: transaction.description,
        amount: transaction.amount / 100,
        category: transaction.category ?? "",
        date: transactionDateInput(transaction.date),
        direction: transaction.direction,
      });
      form.clearErrors();
      setFormOpen(true);
    },
    [form],
  );

  async function saveTransaction(values: TransactionFormValues) {
    if (!values.date) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${config.apiUrl}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          amount: Math.round(Number(values.amount) * 100),
          description: values.description.trim(),
          date: values.date.toISOString(),
          category: values.category.trim(),
          direction: values.direction,
          ...(editing ? { id: editing.transactionID } : {}),
        }),
      });
      if (!response.ok) {
        throw new Error(await responseError(response));
      }
      setFormOpen(false);
      setEditing(null);
      form.reset();
      await loadTransactions();
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function deleteTransactions(ids: string[]) {
    setDeleting(true);
    setError(null);
    try {
      for (const id of ids) {
        const response = await fetch(`${config.apiUrl}/transactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify({ delete: true, id }),
        });
        if (!response.ok) {
          throw new Error(await responseError(response));
        }
      }
      setSelected({});
      setDeleteConfirmation(null);
      await loadTransactions();
    } catch (deleteError) {
      setError(errorMessage(deleteError));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Stack className="transaction-screen" gap="lg">
      <Group justify="space-between" align="center" wrap="wrap">
        <div>
          <Title order={2}>Transactions</Title>
          <Text c="dimmed" size="sm">
            Keep track of money coming in and going out.
          </Text>
        </div>
        <Group>
          <ActionIcon
            aria-label="Refresh transactions"
            variant="subtle"
            size="lg"
            onClick={() => void loadTransactions()}
            loading={loading}
          >
            <FaRotate />
          </ActionIcon>
          <Button leftSection={<FaPlus />} onClick={openNewTransaction}>
            Add transaction
          </Button>
        </Group>
      </Group>

      {error && (
        <Alert
          color="red"
          title="Something went wrong"
          withCloseButton
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Group grow align="stretch">
        <Card withBorder radius="md" padding="md">
          <Text c="dimmed" size="sm">
            Net total
          </Text>
          <Title order={3} mt={4}>
            {formatCurrency(totals.income - totals.expenses)}
          </Title>
        </Card>
        <Card withBorder radius="md" padding="md">
          <Text c="dimmed" size="sm">
            Income
          </Text>
          <Text c="teal.8" fw={600} size="lg" mt={4}>
            {formatCurrency(totals.income)}
          </Text>
        </Card>
        <Card withBorder radius="md" padding="md">
          <Text c="dimmed" size="sm">
            Expenses
          </Text>
          <Text c="red.8" fw={600} size="lg" mt={4}>
            {formatCurrency(totals.expenses)}
          </Text>
        </Card>
      </Group>

      <Stack gap="sm">
        <Group justify="space-between" align="center" wrap="wrap">
          <TextInput
            aria-label="Search transactions"
            leftSection={<FaMagnifyingGlass />}
            placeholder="Search description or category"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            w={{ base: "100%", sm: "20rem" }}
          />
          <SegmentedControl
            aria-label="Filter transactions by type"
            value={filter}
            onChange={(value) => setFilter(value as Filter)}
            data={[
              { label: "All", value: "all" },
              { label: "Income", value: "income" },
              { label: "Expenses", value: "expense" },
            ]}
          />
        </Group>

        {selectedIds.length > 0 && (
          <Group className="selection-strip" justify="space-between">
            <Text size="sm">{selectedIds.length} selected</Text>
            <Group gap="xs">
              <Button
                variant="subtle"
                size="compact-sm"
                onClick={() => setSelected({})}
              >
                Clear
              </Button>
              <Button
                color="red"
                variant="light"
                size="compact-sm"
                leftSection={<FaTrash />}
                onClick={() => setDeleteConfirmation(selectedIds)}
              >
                Delete selected
              </Button>
            </Group>
          </Group>
        )}

        <Stack className="transaction-list" gap="xs">
          {loading && transactions.length === 0 ? (
            <Group justify="center" py="xl">
              <Loader size="sm" />
              <Text c="dimmed" size="sm">
                Loading transactions…
              </Text>
            </Group>
          ) : visibleTransactions.length === 0 ? (
            <Card className="empty-state" withBorder radius="md" padding="xl">
              <Stack align="center" gap="xs">
                <Text fw={600}>
                  {transactions.length === 0
                    ? "No transactions yet"
                    : "No transactions found"}
                </Text>
                <Text c="dimmed" size="sm" ta="center">
                  {transactions.length === 0
                    ? "Add your first transaction to see your money activity here."
                    : "Try another search or change the selected filter."}
                </Text>
                {transactions.length === 0 && (
                  <Button
                    mt="xs"
                    leftSection={<FaPlus />}
                    onClick={openNewTransaction}
                  >
                    Add transaction
                  </Button>
                )}
              </Stack>
            </Card>
          ) : (
            visibleTransactions.map((transaction) => (
              <TransactionRow
                key={transaction.transactionID}
                transaction={transaction}
                selected={Boolean(selected[transaction.transactionID])}
                onToggle={toggleTransaction}
                onEdit={openEditTransaction}
                onDelete={requestDelete}
              />
            ))
          )}
        </Stack>
      </Stack>

      <Modal
        opened={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
          form.reset();
        }}
        title={editing ? "Edit transaction" : "Add transaction"}
        centered
      >
        <form onSubmit={form.onSubmit(saveTransaction)}>
          <Stack>
            <SegmentedControl
              fullWidth
              value={form.values.direction}
              onChange={(value) =>
                form.setFieldValue(
                  "direction",
                  value === "income" ? "income" : "expense",
                )
              }
              data={[
                { label: "Expense", value: "expense" },
                { label: "Income", value: "income" },
              ]}
            />
            <NumberInput
              label="Amount"
              placeholder="0.00"
              prefix="£ "
              decimalScale={2}
              min={0}
              hideControls
              withAsterisk
              {...form.getInputProps("amount")}
            />
            <TextInput
              label="Description"
              placeholder="e.g. Weekly groceries"
              withAsterisk
              {...form.getInputProps("description")}
            />
            <Autocomplete
              label="Category"
              placeholder="Choose or type a category"
              data={categories}
              {...form.getInputProps("category")}
            />
            <DatePickerInput
              label="Date"
              withAsterisk
              value={form.values.date}
              onChange={(date) => form.setFieldValue("date", date)}
              error={form.errors.date}
              maxDate={new Date()}
            />
            <Group justify="flex-end" mt="xs">
              <Button
                variant="subtle"
                onClick={() => {
                  setFormOpen(false);
                  setEditing(null);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {editing ? "Save changes" : "Add transaction"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={deleteConfirmation !== null}
        onClose={() => setDeleteConfirmation(null)}
        title="Delete transaction"
        centered
      >
        <Stack>
          <Text>
            {deleteConfirmation?.length === 1
              ? "This transaction will be permanently deleted."
              : `${deleteConfirmation?.length ?? 0} transactions will be permanently deleted.`}
          </Text>
          <Group justify="flex-end">
            <Button
              variant="subtle"
              onClick={() => setDeleteConfirmation(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              color="red"
              loading={deleting}
              onClick={() =>
                deleteConfirmation &&
                void deleteTransactions(deleteConfirmation)
              }
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

export default TransactionsPage;
