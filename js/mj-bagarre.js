const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get("sessionId") || localStorage.getItem("sessionId");

const ordreUl = document.getElementById("liste-initiative");
const messageTour = document.getElementById("info-tour");
const zoneActions = document.getElementById("actions-mj");
const boutonAttaquer = document.getElementById("btn-attaquer");
const boutonSoigner = document.getElementById("btn-soigner");
const boutonPasser = document.getElementById("btn-passer");

let currentTurnIndex = 0;
let ordreCombat = [];

async function fetchOrdreCombat() {
    try {
      const response = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        ordreCombat = data?.ordreTour || [];
        currentTurnIndex = data?.indexTour || 0;
        afficherOrdreCombat();
        afficherTourActuel();
      } else {
        console.error("Erreur récupération session combat");
      }
    } catch (err) {
      console.error("Erreur réseau:", err);
    }
  }

  function afficherOrdreCombat() {
    ordreUl.innerHTML = "";
  
    const table = document.createElement("table");
    table.className = "table-ordre";
  
    const thead = document.createElement("thead");
    thead.innerHTML = `<tr><th>Nom</th><th>Initiative</th><th>PV</th></tr>`;
    table.appendChild(thead);
  
    const tbody = document.createElement("tbody");
    ordreCombat.forEach((entite, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${index === currentTurnIndex ? "🎯 " : ""}${entite.pseudo || entite.nom}</td>
        <td>${entite.initiative}</td>
        <td>${typeof entite.pv === "number" ? entite.pv : "-"}</td>
      `;
      if (index === currentTurnIndex) tr.classList.add("highlight-row");
      tbody.appendChild(tr);
    });
  
    table.appendChild(tbody);
    ordreUl.appendChild(table);
  }

function afficherTourActuel() {
  const entite = ordreCombat[currentTurnIndex];
  if (entite) {
    messageTour.textContent = `🎯 C'est au tour de ${entite.pseudo || entite.nom} de jouer.`;

    // Si c'est un monstre → MJ peut agir
    const estMonstre = !entite.id; // Si pas d'ID, c'est un monstre
    zoneActions.style.display = estMonstre ? "block" : "none";
  }
}

// 🎯 Passer le tour ➜ avance dans la liste
boutonPasser.addEventListener("click", () => {
  currentTurnIndex = (currentTurnIndex + 1) % ordreCombat.length;
  afficherOrdreCombat();
  afficherTourActuel();
});

fetchOrdreCombat();

setInterval(fetchOrdreCombat, 3000);
