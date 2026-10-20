(() => {
  const dropdown = document.getElementById("yearDropdown");
  const trigger = document.getElementById("yearTrigger");
  const options = document.getElementById("yearOptions");
  const selected = document.getElementById("yearSelected");

  if (!dropdown || !Array.isArray(revistas)) return;

  const years = [...new Set(revistas.map(r => r.anio))]
    .sort((a, b) => b - a);

  let currentYear = years[0];
  if (!years.length) return;

  function closeMenu() {
    options.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  }

  function chooseYear(year) {
    currentYear = year;
    selected.textContent = String(year);

    document.querySelectorAll(
      "#archiveGrid [data-revista]"
    ).forEach(card => {
      const revista = revistas.find(
        r => r.id === card.dataset.revista
      );
      card.hidden = !revista || revista.anio !== year;
    });

    options.querySelectorAll("button").forEach(btn => {
      btn.setAttribute(
        "aria-selected",
        String(Number(btn.dataset.year) === year)
      );
    });

    closeMenu();
  }

  years.forEach(year => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = year;
    button.dataset.year = year;
    button.setAttribute("role", "option");

    button.addEventListener("click", () => chooseYear(year));
    options.appendChild(button);
  });

  options.setAttribute("role", "listbox");

  trigger.addEventListener("click", () => {
    const opening = options.hidden;
    options.hidden = !opening;
    trigger.setAttribute("aria-expanded", String(opening));
  });

  document.addEventListener("click", event => {
    if (!dropdown.contains(event.target)) closeMenu();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !options.hidden) {
      closeMenu();
      trigger.focus();
    }
  });

  chooseYear(currentYear);
})();