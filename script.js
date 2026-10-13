document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".nav a").forEach((link) => {
    if (link.href === window.location.href) link.classList.add("active");
  });

  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  // The account page is a transparent, browser-local DEMO only.
  // This is not authentication, a real ledger, or a payment system.
  const storageKey = "analyst-demo-ledger-v1";
  const balanceElement = document.getElementById("balance");
  const ledgerElement = document.getElementById("ledger");
  const adminForm = document.getElementById("admin-form");
  const withdrawForm = document.getElementById("withdraw-form");
  const withdrawError = document.getElementById("withdraw-error");
  const resetButton = document.getElementById("reset-ledger");

  if (!balanceElement || !ledgerElement) return;

  const formatUGX = (amount) =>
    new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      maximumFractionDigits: 0
    }).format(amount);

  const readEntries = () => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
      return Array.isArray(stored)
        ? stored.filter((entry) =>
            entry &&
            Number.isSafeInteger(entry.amount) &&
            entry.amount > 0 &&
            ["adjustment", "withdrawal"].includes(entry.type) &&
            typeof entry.createdAt === "string"
          )
        : [];
    } catch {
      return [];
    }
  };

  let entries = readEntries();

  const getBalance = () =>
    entries.reduce(
      (total, entry) => total + (entry.type === "adjustment" ? entry.amount : -entry.amount),
      0
    );

  const saveEntries = () => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(entries));
      return true;
    } catch {
      if (withdrawError) {
        withdrawError.textContent = "This browser could not save the demo ledger. Check browser storage settings.";
      }
      return false;
    }
  };

  const renderLedger = () => {
    const balance = getBalance();
    balanceElement.textContent = formatUGX(balance);
    ledgerElement.replaceChildren();

    if (entries.length === 0) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "No demo transactions yet. Add a simulated adjustment to begin.";
      ledgerElement.appendChild(empty);
      return;
    }

    [...entries].reverse().forEach((entry) => {
      const row = document.createElement("div");
      row.className = "ledger-row";

      const details = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = entry.type === "adjustment"
        ? "Demo balance adjustment"
        : "Simulated withdrawal";

      const date = document.createElement("span");
      date.className = "muted";
      const parsedDate = new Date(entry.createdAt);
      date.textContent = Number.isNaN(parsedDate.getTime())
        ? "Date unavailable"
        : parsedDate.toLocaleString();

      const amount = document.createElement("strong");
      amount.className = entry.type === "adjustment" ? "ledger-credit" : "ledger-debit";
      amount.textContent = (entry.type === "adjustment" ? "+" : "−") + formatUGX(entry.amount);

      details.append(title, document.createElement("br"), date);
      row.append(details, amount);
      ledgerElement.appendChild(row);
    });
  };

  if (adminForm) adminForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById("adjustment");
    const amount = Number(input.value);

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      input.setCustomValidity("Enter a positive whole amount in UGX.");
      input.reportValidity();
      input.setCustomValidity("");
      return;
    }

    entries.push({ type: "adjustment", amount, createdAt: new Date().toISOString() });
    if (!saveEntries()) {
      entries.pop();
      return;
    }
    adminForm.reset();
    if (withdrawError) withdrawError.textContent = "";
    renderLedger();
  });

  if (withdrawForm) withdrawForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById("withdrawal");
    const amount = Number(input.value);
    const currentBalance = getBalance();

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      withdrawError.textContent = "Enter a positive whole amount in UGX.";
      return;
    }

    if (amount > currentBalance) {
      withdrawError.textContent = "Insufficient simulated balance. No transaction was recorded.";
      return;
    }

    const entry = { type: "withdrawal", amount, createdAt: new Date().toISOString() };
    entries.push(entry);
    if (!saveEntries()) {
      entries.pop();
      return;
    }

    withdrawForm.reset();
    withdrawError.textContent = "Demo withdrawal recorded. No real money was transferred.";
    renderLedger();
  });

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      if (!window.confirm("Reset this browser's demo ledger? This cannot be undone.")) return;
      const previousEntries = entries;
      entries = [];
      if (!saveEntries()) {
        entries = previousEntries;
        return;
      }
      if (withdrawError) withdrawError.textContent = "";
      renderLedger();
    });
  }

  renderLedger();
});