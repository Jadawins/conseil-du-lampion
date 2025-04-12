// theme.js
document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("theme-toggle");
    const body = document.body;
  
    // Appliquer le thème sauvegardé au chargement
    const savedTheme = localStorage.getItem("theme") || "dark";
    body.setAttribute("data-theme", savedTheme);
  
    if (toggle) {
      toggle.checked = savedTheme === "light";
  
      toggle.addEventListener("change", () => {
        const theme = toggle.checked ? "light" : "dark";
        body.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
      });
    }
  });
  