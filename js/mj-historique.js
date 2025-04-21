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
        tr.className = "combat-summary";
        ligne.textContent = "Aucun combat enregistré.";
        table.appendChild(ligne);
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
      const tr = document.createElement("tr");
      tr.className = "combat-summary";
      ligne.innerHTML = `
        <span class="combat-id">${combat.id || `Combat ${index + 1}`}</span>
        <span class="combat-date">${horodatage}</span>
        <span class="combat-resultat">${resultat}</span>
        <span class="combat-stats">${joueursVivants} 🧝 / ${joueursMorts} 💀 / ${nbMonstres} 👹</span>
      `;
      table.appendChild(ligne);
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

async function afficherJournalCombat() {
  const response = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`);
  if (!response.ok) return;
  const data = await response.json();
  const log = data.logCombat || [];
  const ul = document.getElementById("log-combat");
  ul.innerHTML = "";

  log.slice(-10).reverse().forEach(entry => {
    const li = document.createElement("li");
    const time = new Date(entry.timestamp).toLocaleTimeString("fr-FR", {
      hour: "2-digit", minute: "2-digit"
    });

    let texte = "";
    let classe = "";

    if (entry.type === "soin") {
      texte = `🩹 [${time}] ${entry.auteur} soigne ${entry.cible} de ${entry.valeur} PV`;
      if (entry.overheal && entry.overheal > 0) {
        texte += ` dont ${entry.overheal} en trop`;
      }
      classe = "log-soin";
    } else if (entry.type === "attaque") {
      texte = `⚔️ [${time}] ${entry.auteur} attaque ${entry.cible} pour ${entry.degats} dégâts`;
      classe = "log-attaque";
    } else if (entry.type === "mort") {
      texte = `☠️ [${time}] ${entry.cible} est mort (par ${entry.auteur})`;
      classe = "log-mort";
    } else if (entry.type === "sortie_combat") {
      texte = `🚪 [${time}] ${entry.cible} quitte le combat (PV à 0)`;
      classe = "log-sortie";
    } else if (entry.type === "fin_combat") {
      texte = `🏁 [${time}] Fin du combat – ${entry.resultat === "victoire" ? "Victoire !" : "Défaite..."}`;
      classe = "log-victoire";
    } else {
      texte = `📌 [${time}] ${entry.auteur || "?"} fait une action inconnue.`;
      classe = "log-inconnu";
    }

    li.textContent = texte;
    li.classList.add(classe);
    ul.appendChild(li);
  });
}

function afficherCombats(sessionData) {
  const tableBody = document.getElementById("table-combats");
  tableBody.innerHTML = "";

  sessionData.combats.forEach((combat, index) => {
    const tr = document.createElement("tr");
    tr.className = "combat-entry";
    tr.style.cursor = "pointer";
    tr.addEventListener("click", () => {
      const detailRow = tr.nextElementSibling;
      if (detailRow.style.display === "table-row") {
        detailRow.style.display = "none";
      } else {
        detailRow.style.display = "table-row";
      }
    });

    tr.innerHTML = `
      <td><strong>Combat ${index + 1}</strong></td>
      <td>${new Date(combat.date).toLocaleDateString("fr-FR")} ${new Date(combat.date).toLocaleTimeString("fr-FR")}</td>
      <td>🧙 ${combat.nbJoueurs}</td>
      <td>${combat.resultat === "victoire" ? "🏅 Victoire" : "☠️ Défaite"}</td>
      <td>💀 ${combat.nbMorts} / 😈 ${combat.nbMonstres}</td>
    `;

    // Ligne cachée pour le journal
    const detailTr = document.createElement("tr");
    detailTr.style.display = "none";
    detailTr.innerHTML = `
      <td colspan="5">${genererJournalCombat(combat.logCombat)}</td>
    `;

    tableBody.appendChild(tr);
    tableBody.appendChild(detailTr);
  });
}

