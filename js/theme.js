document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("theme-toggle");
  const moonIcon = document.querySelector(".icon-moon");
  const sunIcon = document.querySelector(".icon-sun");

  const savedTheme = localStorage.getItem("theme") || "dark";
  document.body.setAttribute("data-theme", savedTheme);

  if (themeToggle) {
    themeToggle.checked = savedTheme === "light";

    if (moonIcon && sunIcon) {
      moonIcon.style.opacity = savedTheme === "light" ? "0" : "1";
      sunIcon.style.opacity = savedTheme === "light" ? "1" : "0";
    }

    themeToggle.addEventListener("change", () => {
      const theme = themeToggle.checked ? "light" : "dark";
      document.body.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);

      if (moonIcon && sunIcon) {
        moonIcon.style.opacity = theme === "light" ? "0" : "1";
        sunIcon.style.opacity = theme === "light" ? "1" : "0";
      }
    });
  }
});
