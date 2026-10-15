(() => {
  const host = document.getElementById("machine-stock");
  const search = document.getElementById("machine-search");
  const category = document.getElementById("machine-category");
  const sort = document.getElementById("machine-sort");
  if (!host || !search || !category || !sort) return;
  let applying = false;

  const apply = () => {
    if (applying) return;
    applying = true;
    const term = search.value.trim().toLowerCase();
    const selectedCategory = category.value;
    const cards = [...host.querySelectorAll(":scope > .card")];
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      const matchesTerm = !term || text.includes(term);
      const matchesCategory = selectedCategory === "all" || text.includes(selectedCategory.toLowerCase());
      card.hidden = !(matchesTerm && matchesCategory);
    });
    const visible = cards.filter(card => !card.hidden);
    const empty = document.getElementById("machine-empty");
    if (empty) empty.hidden = visible.length > 0;
    if (sort.value !== "default") {
      const getPrice = card => {
        const match = card.textContent.match(/Catalogue price:\s*UGX\s*([\d,]+)/i);
        return match ? Number(match[1].replace(/,/g, "")) : 0;
      };
      visible.sort((a, b) => sort.value === "price-low" ? getPrice(a) - getPrice(b) : getPrice(b) - getPrice(a));
      visible.forEach((card, index) => {
        if (host.children[index] !== card) host.insertBefore(card, host.children[index] || null);
      });
    }
    applying = false;
  };
  [search, category, sort].forEach(el => el.addEventListener("input", apply));
  new MutationObserver(() => { if (!applying) apply(); }).observe(host, { childList: true });
  apply();
})();