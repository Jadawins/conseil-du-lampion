// ✅ mj-historique.js – affichage des combats terminés

const sessionId = localStorage.getItem("sessionId");
const url = `https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`;

async function chargerDernieresSessions() {
  const select = document.getElementById("session-select");
  select.innerHTML = `<option value="">-- Session actuelle --</option>`; // on vide

  try {
    const response = await fetch("https://lampion-api.azurewebsites.net/api/ListerSession");
    if (!response.ok) throw new Error("Erreur API ListerSession");

    const sessions = await response.json();
    if (!Array.isArray(sessions)) throw new Error("Réponse inattendue");

    sessions.forEach(s => {
      const option = document.createElement("option");
      option.value = s.sessionId;
      option.textContent = `${s.nomAventure} (${new Date(s.timestampFin).toLocaleString("fr-FR")})`;
      select.appendChild(option);
    });

    // Si la session actuelle est connue, on la pré-sélectionne
    const currentId = localStorage.getItem("sessionId");
    if (currentId) {
      select.value = currentId;
    }

  } catch (err) {
    console.error("❌ Erreur chargement des dernières sessions :", err);
  }
}


window.addEventListener("DOMContentLoaded", async () => {
  await chargerDernieresSessions();

  document.getElementById("session-select").addEventListener("change", (e) => {
    const selectedId = e.target.value;
    if (selectedId) {
      chargerHistoriquePourSession(selectedId);
    }
  });

  chargerHistoriquePourSession(sessionId);
});

async function chargerHistoriquePourSession(sessionId) {
  const url = `https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`;
  const table = document.getElementById("combat-historique-body");
  table.innerHTML = "";

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Erreur récupération session");

    const data = await response.json();
    const combats = data.combats || [];

    if (combats.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="4">Aucun combat enregistré.</td>`;
      table.appendChild(tr);
      return;
    }

    combats.forEach((combat, index) => {
      const tr = document.createElement("tr");

      let joueursVivants = 0;
      let joueursMorts = 0;

      if (Array.isArray(combat.joueurs)) {
        combat.joueurs.forEach(j => {
          if (typeof j.pv === "number") {
            if (j.pv > 0) joueursVivants++;
            else joueursMorts++;
          }
        });
      }

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
        <td>${horodatage}</td>
        <td>${resultat}</td>
        <td>${joueursVivants} 🧝 / ${joueursMorts} 💀 / ${nbMonstres} 👹</td>
      `;

      const logRow = document.createElement("tr");
      logRow.classList.add("log-row");
      logRow.style.display = "none";

      const logCell = document.createElement("td");
      logCell.colSpan = 4;
      logCell.innerHTML = genererJournalCombat(combat.logCombat);
      logRow.appendChild(logCell);

      tr.addEventListener("click", () => {
        const isVisible = logRow.style.display === "table-row";
        logRow.style.display = isVisible ? "none" : "table-row";
        logCell.style.display = isVisible ? "none" : "table-cell";
      });

      table.appendChild(tr);
      table.appendChild(logRow);
    });
  } catch (err) {
    console.error("❌ Erreur GetSession:", err);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4">Erreur de chargement des données</td>`;
    table.appendChild(tr);
  }
}

function genererJournalCombat(log) {
  if (!Array.isArray(log) || log.length === 0) return `<em>Journal vide</em>`;
  return `
    <div class="journal-combat">
      <ul>
        ${log.map(e => `
          <li>
            ${e.timestamp ? `<strong>[${new Date(e.timestamp).toLocaleTimeString("fr-FR")}]</strong>` : ""}
            ${e.auteur || "?"} ${e.action || ""}
          </li>`).join("")}
      </ul>
    </div>
  `;
}
