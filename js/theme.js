// theme.js
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("theme-toggle");
  const body = document.body;

  const moonIcon = document.querySelector(".icon-moon");
  const sunIcon = document.querySelector(".icon-sun");

  // Appliquer le thème sauvegardé au chargement
  const savedTheme = localStorage.getItem("theme") || "dark";
  body.setAttribute("data-theme", savedTheme);
  if (toggle) toggle.checked = savedTheme === "light";

  // Appliquer visuellement les bonnes icônes
  if (savedTheme === "light") {
    moonIcon.style.opacity = "0";
    sunIcon.style.opacity = "1";
  } else {
    moonIcon.style.opacity = "1";
    sunIcon.style.opacity = "0";
  }

  toggle.addEventListener("change", () => {
    const theme = toggle.checked ? "light" : "dark";
    body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    // Mettre à jour les icônes en fonction du thème
    if (theme === "light") {
      moonIcon.style.opacity = "0";
      sunIcon.style.opacity = "1";
    } else {
      moonIcon.style.opacity = "1";
      sunIcon.style.opacity = "0";
    }
  });
});
