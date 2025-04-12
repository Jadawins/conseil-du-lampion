// theme.js
document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("theme-toggle");
    const body = document.body;
  
    // 🌙 Thème sombre par défaut
    const savedTheme = localStorage.getItem("theme") || "dark";
    body.setAttribute("data-theme", savedTheme);
    
    if (toggle) {
      // Mettre à jour l’état du bouton
      toggle.checked = savedTheme === "light";
  
      toggle.addEventListener("change", () => {
        const newTheme = toggle.checked ? "light" : "dark";
        body.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
      });
    }
  });
  