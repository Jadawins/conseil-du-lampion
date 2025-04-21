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
      const ligne = document.createElement("div");
        ligne.className = "combat-entry";
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
      const ligne = document.createElement("div");
      ligne.className = "combat-entry";
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

function genererJournalCombat(log) {
  if (!Array.isArray(log) || log.length === 0) return `<em>Journal vide</em>`;

  return `
    <div class="journal-combat">
      <ul class="journal-combat-list">
        ${log.map(e => {
          const time = e.timestamp
            ? `<strong>[${new Date(e.timestamp).toLocaleTimeString("fr-FR")}]</strong>`
            : "";
          let texte = "";
          let classe = "";

          if (e.type === "soin") {
            texte = `🩹 ${e.auteur} soigne ${e.cible} de ${e.valeur} PV`;
            if (e.overheal && e.overheal > 0) {
              texte += ` dont ${e.overheal} en trop`;
            }
            classe = "log-soin";
          } else if (e.type === "attaque") {
            texte = `⚔️ ${e.auteur} attaque ${e.cible} pour ${e.degats} dégâts`;
            classe = "log-attaque";
          } else if (e.type === "mort") {
            texte = `☠️ ${e.cible} est mort (par ${e.auteur})`;
            classe = "log-mort";
          } else if (e.type === "sortie_combat") {
            texte = `🚪 ${e.cible} quitte le combat (PV à 0)`;
            classe = "log-sortie";
          } else if (e.type === "fin_combat") {
            texte = `🏁 Fin du combat – ${e.resultat === "victoire" ? "Victoire !" : "Défaite..."}`;
            classe = "log-victoire";
          } else if (e.type === "passer_tour") {
            texte = `⏭️ ${e.auteur} passe son tour.`;
            classe = "log-pass";
          } else {
            texte = `${e.auteur || "?"} fait une action inconnue.`;
            classe = "log-inconnu";
          }

          return `<li class="${classe}">${time} ${texte}</li>`;
        }).join("")}
      </ul>
    </div>
  `;
}
