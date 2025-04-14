// 🔄 mj-combat.js – nom de l'aventure via API
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get("sessionId") || localStorage.getItem("sessionId");

async function recupererSessionDepuisAPI(sessionId) {
  try {
    const response = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.error("Erreur API:", e);
  }
  return null;
}

(async () => {
  const data = await recupererSessionDepuisAPI(sessionId);
  const nomAventure = data?.nomAventure || "(Aventure mystère)";
  document.getElementById("titre-aventure").textContent = `${nomAventure}`;
  document.getElementById("session-id-display").textContent = `🆔 Session ID : ${sessionId}`;
})();

const joueursKey = `joueursLampion-${sessionId}`;
const monstresKey = `monstresLampion-${sessionId}`;
const ordreKey = `ordreFinal-${sessionId}`;

const form = document.getElementById("form-combat");
const listeMonstresDiv = document.getElementById("liste-monstres");
const listeJoueursDiv = document.getElementById("liste-joueurs");
const ordreUl = document.getElementById("ordre");
const ordreTitre = document.getElementById("ordre-titre");
const resetBtn = document.getElementById("reset");
const lancerBtn = document.getElementById("lancer");

const editModal = document.getElementById("edit-modal");
const editNomInput = document.getElementById("edit-nom");
const editInitInput = document.getElementById("edit-initiative");
const editConfirm = document.getElementById("edit-confirm");
const editCancel = document.getElementById("edit-cancel");
let monstreIndexAModifier = null;

let monstres = JSON.parse(localStorage.getItem(monstresKey)) || [];
let combatLance = false;

function afficherListeTemporaire() {
  monstres = JSON.parse(localStorage.getItem(monstresKey)) || [];
  listeMonstresDiv.innerHTML = "";
  listeJoueursDiv.innerHTML = "";

  const tableMonstres = document.createElement("table");
  tableMonstres.className = "table-monstres";
  const theadM = document.createElement("thead");
  theadM.innerHTML = `
    <tr>
      <th>🧟 Monstre</th>
      <th>⚔️ Initiative</th>
      <th>🪄 Modifier</th>
      <th>🔥 Supprimer</th>
    </tr>
  `;
  tableMonstres.appendChild(theadM);
  const tbodyM = document.createElement("tbody");

  monstres.forEach((m, index) => {
    const tr = document.createElement("tr");

    const tdNom = document.createElement("td");
    tdNom.textContent = m.nom;

    const tdInit = document.createElement("td");
    tdInit.textContent = m.initiative;

    const tdEdit = document.createElement("td");
    const editBtn = document.createElement("button");
    editBtn.textContent = "🪄";
    editBtn.className = "icon-btn";
    editBtn.title = "Modifier ce monstre";
    editBtn.dataset.index = index;
    editBtn.addEventListener("click", (e) => {
      const idx = e.currentTarget.dataset.index;
      monstreIndexAModifier = idx;
      editNomInput.value = monstres[idx].nom;
      editInitInput.value = monstres[idx].initiative;
      editModal.classList.remove("hidden");
    });
    tdEdit.appendChild(editBtn);

    const tdAction = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = "🔥";
    deleteBtn.className = "icon-btn";
    deleteBtn.title = "Supprimer ce monstre";
    deleteBtn.addEventListener("click", () => {
      monstres.splice(index, 1);
      localStorage.setItem(monstresKey, JSON.stringify(monstres));
      afficherListeTemporaire();
    });
    tdAction.appendChild(deleteBtn);

    tr.appendChild(tdNom);
    tr.appendChild(tdInit);
    tr.appendChild(tdEdit);
    tr.appendChild(tdAction);
    tbodyM.appendChild(tr);
  });

  tableMonstres.appendChild(tbodyM);
  listeMonstresDiv.appendChild(tableMonstres);

  const joueurs = JSON.parse(localStorage.getItem(joueursKey)) || [];
  if (joueurs.length > 0) {
    const tableJoueurs = document.createElement("table");
    tableJoueurs.className = "table-monstres";
    const theadJ = document.createElement("thead");
    theadJ.innerHTML = `
      <tr>
        <th>🧝 Joueur</th>
        <th>⚔️ Initiative</th>
      </tr>
    `;
    tableJoueurs.appendChild(theadJ);

    const tbodyJ = document.createElement("tbody");
    joueurs.forEach(j => {
      const tr = document.createElement("tr");
      const tdNom = document.createElement("td");
      tdNom.textContent = j.nom;

      const tdInit = document.createElement("td");
      tdInit.textContent = j.initiative;

      tr.appendChild(tdNom);
      tr.appendChild(tdInit);
      tbodyJ.appendChild(tr);
    });

    tableJoueurs.appendChild(tbodyJ);
    listeJoueursDiv.appendChild(tableJoueurs);
  }
}

if (!combatLance) {
  afficherListeTemporaire();
}
