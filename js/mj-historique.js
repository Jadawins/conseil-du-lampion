// ✅ mj-historique.js – affichage des combats terminés

const sessionId = localStorage.getItem("sessionId");
const url = `https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`;

window.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Erreur de récupération de session");

    const data = await response.json();
    const combats = data.combats || [];

    const table = document.getElementById("combat-historique-body");
    if (!table) return;

    if (combats.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="4">Aucun combat enregistré.</td>`;
      table.appendChild(tr);
      return;
    }

    combats.forEach((combat, index) => {
      const tr = document.createElement("tr");

      const nbJoueurs = combat.joueurs?.length || 0;
      const nbMonstres = combat.monstres?.length || 0;

      const resultat =
        combat.resultat === "victoire"
          ? "🎉 Victoire"
          : combat.resultat === "défaite"
          ? "☠️ Défaite"
          : "❓ Inconnu";

      const date = new Date(combat.timestampFin);
      const horodatage = date.toLocaleString("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      });

      tr.innerHTML = `
        <td>${combat.id || `Combat ${index + 1}`}</td>
        <td>${nbJoueurs} 🧝 / ${nbMonstres} 👹</td>
        <td>${resultat}</td>
        <td>${horodatage}</td>
      `;

      table.appendChild(tr);
    });
  } catch (err) {
    console.error("Erreur chargement historique:", err);
    const table = document.getElementById("table-combats");
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4">Erreur de chargement des données</td>`;
    table.appendChild(tr);
  }
});
