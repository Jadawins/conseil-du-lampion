// theme.js
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("theme-toggle");
  const body = document.body;
  const themeIcon = document.getElementById("theme-icon");

  // Thème par défaut : sombre
  const savedTheme = localStorage.getItem("theme") || "dark";
  body.setAttribute("data-theme", savedTheme);

  if (toggle) {
    toggle.checked = savedTheme === "light";
    themeIcon.textContent = savedTheme === "light" ? "🌞" : "🌙";

    toggle.addEventListener("change", () => {
      const theme = toggle.checked ? "light" : "dark";
      body.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
      themeIcon.textContent = theme === "light" ? "🌞" : "🌙";
    });
  }
});
