// Due dates are stored as the END of the chosen day in the user's local time,
// so a task due today only becomes overdue once the day is over.

export function toDateInputValue(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromDateInputValue(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59).toISOString();
}

export function isOverdue(dueDate: string | null, status: string) {
  return !!dueDate && status !== "COMPLETED" && new Date(dueDate) < new Date();
}