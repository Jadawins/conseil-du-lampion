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
const editPVInput = document.getElementById("edit-pv");
const editConfirm = document.getElementById("edit-confirm");
const editCancel = document.getElementById("edit-cancel");
let monstreIndexAModifier = null;

const editJoueurModal = document.getElementById("edit-joueur-modal");
const editJoueurNomInput = document.getElementById("edit-joueur-nom");
const editJoueurPVInput = document.getElementById("edit-joueur-pv");
const editJoueurInitInput = document.getElementById("edit-joueur-init");
const editJoueurConfirm = document.getElementById("edit-joueur-confirm");
const editJoueurCancel = document.getElementById("edit-joueur-cancel");
let joueurIndexAModifier = null;

let monstres = JSON.parse(localStorage.getItem(monstresKey)) || [];
let combatLance = false;

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const nom = document.getElementById("nom-monstre").value.trim();
  const pv = parseInt(document.getElementById("pv-monstre").value);
  const initiative = parseInt(document.getElementById("initiative-monstre").value);
  if (!nom || isNaN(pv) || isNaN(initiative)) return;
  const existeDeja = monstres.some(monstre => monstre.nom.toLowerCase() === nom.toLowerCase());
  if (existeDeja) {
    alert("⚠️ Un monstre avec ce nom existe déjà !");
    return;
  }
  monstres.push({ nom, pv, initiative });
  localStorage.setItem(monstresKey, JSON.stringify(monstres));
  form.reset();
  if (!combatLance) afficherListeTemporaire();
});

editConfirm.addEventListener("click", () => {
  const newName = editNomInput.value.trim();
  const newInit = parseInt(editInitInput.value);
  const newPV = parseInt(editPVInput.value);
  if (newName && !isNaN(newInit) && !isNaN(newPV) && monstreIndexAModifier !== null) {
    monstres[monstreIndexAModifier] = { nom: newName, initiative: newInit, pv: newPV };
    localStorage.setItem(monstresKey, JSON.stringify(monstres));
    afficherListeTemporaire();
    editModal.classList.add("hidden");
    monstreIndexAModifier = null;
  }
});

editCancel.addEventListener("click", () => {
  editModal.classList.add("hidden");
});

editJoueurCancel.addEventListener("click", () => {
  editJoueurModal.classList.add("hidden");
  joueurIndexAModifier = null;
});

editJoueurConfirm.addEventListener("click", async () => {
  const newNom = editJoueurNomInput.value.trim();
  const newPV = parseInt(editJoueurPVInput.value);
  const newInit = parseInt(editJoueurInitInput.value);
  if (!newNom || isNaN(newPV) || isNaN(newInit)) return;

  const data = await recupererSessionDepuisAPI(sessionId);
  if (!data?.joueurs) return;

  data.joueurs[joueurIndexAModifier].pseudo = newNom;
  data.joueurs[joueurIndexAModifier].pv = newPV;
  data.joueurs[joueurIndexAModifier].initiative = newInit;

  await fetch(`https://lampion-api.azurewebsites.net/api/UpdateSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: sessionId, joueurs: data.joueurs })
  });

  editJoueurModal.classList.add("hidden");
  afficherListeTemporaire();
});

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
      <th>❤️ PV</th>
      <th>⚔️ Initiative</th>
      <th>🪄 Modifier</th>
      <th>🔥 Supprimer</th>
    </tr>
  `;
  tableMonstres.appendChild(theadM);
  const tbodyM = document.createElement("tbody");

  monstres.forEach((m, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.nom}</td>
      <td>${m.pv}</td>
      <td>${m.initiative}</td>
      <td><button class="icon-btn" title="Modifier" data-index="${index}">🪄</button></td>
      <td><button class="icon-btn" title="Supprimer">🔥</button></td>
    `;
    tr.querySelector('[title="Modifier"]').addEventListener("click", () => {
      monstreIndexAModifier = index;
      editNomInput.value = m.nom;
      editInitInput.value = m.initiative;
      editPVInput.value = m.pv;
      editModal.classList.remove("hidden");
    });
    tr.querySelector('[title="Supprimer"]').addEventListener("click", () => {
      monstres.splice(index, 1);
      localStorage.setItem(monstresKey, JSON.stringify(monstres));
      afficherListeTemporaire();
    });
    tbodyM.appendChild(tr);
  });

  tableMonstres.appendChild(tbodyM);
  listeMonstresDiv.appendChild(tableMonstres);

  recupererSessionDepuisAPI(sessionId).then(data => {
    const joueurs = data?.joueurs || [];
    const tableJoueurs = document.createElement("table");
    tableJoueurs.className = "table-monstres";
    const theadJ = document.createElement("thead");
    theadJ.innerHTML = `
      <tr>
        <th>🧝 Joueur</th>
        <th>❤️ PV</th>
        <th>⚔️ Initiative</th>
        <th>🪄 Modifier</th>
      </tr>
    `;
    tableJoueurs.appendChild(theadJ);
    const tbodyJ = document.createElement("tbody");

    joueurs.forEach((j, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${j.pseudo}</td>
        <td>${typeof j.pv === "number" ? j.pv : "-"}</td>
        <td>${typeof j.initiative === "number" ? j.initiative : "-"}</td>
        <td><button class="icon-btn" title="Modifier" data-index="${index}">🪄</button></td>
        
      `;

      tr.querySelector('[title="Modifier"]').addEventListener("click", () => {
        joueurIndexAModifier = index;
        editJoueurNomInput.value = j.pseudo;
        editJoueurPVInput.value = j.pv || 0;
        editJoueurInitInput.value = j.initiative || 0;
        editJoueurModal.classList.remove("hidden");
      });

      tbodyJ.appendChild(tr); // ✅ manquait aussi
    }); // 👈 C'EST ICI que tu avais oublié de FERMER la fonction forEach

      
    tableJoueurs.appendChild(tbodyJ);
    listeJoueursDiv.appendChild(tableJoueurs);
  });
};

if (!combatLance) {
  afficherListeTemporaire();
}