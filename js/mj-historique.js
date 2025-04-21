// ✅ mj-historique.js – affichage des combats terminés

const sessionId = localStorage.getItem("sessionId");

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

  const response = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`);
  if (response.ok) {
    const sessionData = await response.json();
    afficherCombats(sessionData);
  }
});

function afficherCombats(sessionData) {
  const tableBody = document.getElementById("table-combats");
  tableBody.innerHTML = "";

  const combats = sessionData.combats || [];
  if (combats.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4">Aucun combat enregistré pour cette session.</td>`;
    tableBody.appendChild(tr);
    return;
  }

  combats.forEach((combat, index) => {
    const date = new Date(combat.timestampFin).toLocaleString("fr-FR");
    const joueursVivants = combat.joueurs?.filter(j => j.pv > 0).length || 0;
    const joueursMorts = combat.joueurs?.filter(j => j.pv === 0).length || 0;
    const monstres = combat.monstres?.length || 0;

    const resultat =
      combat.resultat === "victoire" ? "🎉 Victoire" :
      combat.resultat === "défaite" ? "☠️ Défaite" : "❓ Inconnu";

    const ligne = document.createElement("tr");
    ligne.className = "combat-summary";
    ligne.innerHTML = `
      <td><strong>${combat.id || `Combat ${index + 1}`}</strong></td>
      <td>${date}</td>
      <td>${joueursVivants} 🧝 / ${joueursMorts} 💀 / ${monstres} 👹</td>
      <td>${resultat}</td>
    `;

    const logRow = document.createElement("tr");
    logRow.classList.add("log-row");
    logRow.style.display = "none";

    const logCell = document.createElement("td");
    logCell.colSpan = 4;
    logCell.innerHTML = genererJournalCombat(combat.logCombat);
    logRow.appendChild(logCell);

    ligne.addEventListener("click", () => {
      const visible = logRow.style.display === "table-row";
      logRow.style.display = visible ? "none" : "table-row";
    });

    tableBody.appendChild(ligne);
    tableBody.appendChild(logRow);
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

          switch (e.type) {
            case "soin":
              texte = `🩹 ${e.auteur} soigne ${e.cible} de ${e.valeur} PV`;
              if (e.overheal && e.overheal > 0) {
                texte += ` dont ${e.overheal} en trop`;
              }
              classe = "log-soin"; break;
            case "attaque":
              texte = `⚔️ ${e.auteur} attaque ${e.cible} pour ${e.degats} dégâts`;
              classe = "log-attaque"; break;
            case "mort":
              texte = `☠️ ${e.cible} est mort (par ${e.auteur})`;
              classe = "log-mort"; break;
            case "sortie_combat":
              texte = `🚪 ${e.cible} quitte le combat (PV à 0)`;
              classe = "log-sortie"; break;
            case "fin_combat":
              texte = `🏁 Fin du combat – ${e.resultat === "victoire" ? "Victoire !" : "Défaite..."}`;
              classe = "log-victoire"; break;
            case "passer_tour":
              texte = `⏭️ ${e.auteur} passe son tour.`;
              classe = "log-pass"; break;
            default:
              texte = `${e.auteur || "?"} fait une action inconnue.`;
              classe = "log-inconnu";
          }

          return `<li class="${classe}">${time} ${texte}</li>`;
        }).join("")}
      </ul>
    </div>
  `;
}
const trDetails = document.createElement("tr");
trDetails.className = "accordeon-content"; // classe pour l'animation
trDetails.id = `details-${index}`;
trDetails.classList.remove("open"); // caché par défaut

const td = document.createElement("td");
td.colSpan = 5;
td.innerHTML = genererJournalCombat(combat.logCombat);
trDetails.appendChild(td);
tbody.appendChild(trDetails);

// bouton ou ligne cliquable pour afficher/masquer
ligne.addEventListener("click", () => {
  trDetails.classList.toggle("open");
});
