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

  document.getElementById("session-select").addEventListener("change", async (e) => {
    const selectedId = e.target.value;
    if (selectedId) {
      const response = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession/${selectedId}`);
      if (response.ok) {
        const sessionData = await response.json();
        afficherCombats(sessionData);
      }
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
        tr.textContent = "Aucun combat enregistré.";
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
      tr.className = "combat-summary";
      tr.innerHTML = `
        <span class="combat-id">${combat.id || `Combat ${index + 1}`}</span>
        <span class="combat-date">${horodatage}</span>
        <span class="combat-resultat">${resultat}</span>
        <span class="combat-stats">${joueursVivants} 🧝 / ${joueursMorts} 💀 / ${nbMonstres} 👹</span>
      `;
      table.appendChild(tr);
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
  const section = document.getElementById("liste-combats");
  section.innerHTML = "";

  const combats = sessionData.combats || [];
  if (combats.length === 0) {
    section.innerHTML = "<p>Aucun combat enregistré pour cette session.</p>";
    return;
  }

  const table = document.createElement("table");
  table.className = "styled-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Combat</th>
      <th>Date</th>
      <th>Participants</th>
      <th>Résultat</th>
      <th>Détails</th>
    </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  combats.forEach((combat, index) => {
    const date = new Date(combat.timestamp).toLocaleString("fr-FR");
    const resultat = combat.ordreTour?.length ? "Victoire" : "Défaite";
    const joueurs = combat.ordreTour?.filter(e => e.type === "joueur")?.length || 0;
    const morts = combat.ordreTour?.filter(e => e.type === "joueur" && e.pv === 0)?.length || 0;
    const monstres = combat.ordreTour?.filter(e => e.type === "monstre")?.length || 0;

    const ligne = document.createElement("tr");
    ligne.innerHTML = `
        <td><strong>Combat ${index + 1}</strong></td>
        <td>${date}</td>
        <td>🧙 ${joueurs} / ☠️ ${morts} / 👹 ${monstres}</td>
        <td>${resultat === "Victoire" ? "🎉 Victoire" : "☠️ Défaite"}</td>
        <td><button class="btn-style btn-purple btn-sm" onclick="toggleDetails(${index})">Détails</button></td>
      `;
      tbody.appendChild(ligne);

    // Bloc pour afficher le journal de combat
    const trDetails = document.createElement("tr");
    trDetails.id = `details-${index}`;
    trDetails.style.display = "none";
    trDetails.innerHTML = `<td colspan="5">${genererJournalCombat(combat.logCombat)}</td>`;
    tbody.appendChild(trDetails);
  });

  table.appendChild(tbody);
  section.appendChild(table);
}


