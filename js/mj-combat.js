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

editConfirm.addEventListener("click", () => {
  const newName = editNomInput.value.trim();
  const newInit = parseInt(editInitInput.value);
  if (newName && !isNaN(newInit) && monstreIndexAModifier !== null) {
    monstres[monstreIndexAModifier] = {
      nom: newName,
      initiative: newInit
    };
    localStorage.setItem(monstresKey, JSON.stringify(monstres));
    afficherListeTemporaire();
    editModal.classList.add("hidden");
    monstreIndexAModifier = null;
  }
});

editCancel.addEventListener("click", () => {
  editModal.classList.add("hidden");
});

function afficherOrdre() {
  ordreUl.innerHTML = "";
  const joueurs = JSON.parse(localStorage.getItem(joueursKey)) || [];
  const total = [...monstres, ...joueurs.filter(j => j.initiative > 0)];
  total.sort((a, b) => b.initiative - a.initiative);

  total.forEach(p => {
    const li = document.createElement("li");
    li.textContent = `${p.nom} – Initiative : ${p.initiative}`;
    ordreUl.appendChild(li);
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const nom = document.getElementById("nom-monstre").value.trim();
  const initiative = parseInt(document.getElementById("initiative-monstre").value);
  if (!nom || isNaN(initiative)) return;

  const existeDeja = monstres.some(monstre => monstre.nom.toLowerCase() === nom.toLowerCase());
  if (existeDeja) {
    alert("⚠️ Un monstre avec ce nom existe déjà !");
    return;
  }

  monstres.push({ nom, initiative });
  localStorage.setItem(monstresKey, JSON.stringify(monstres));
  form.reset();
  if (!combatLance) afficherListeTemporaire();
});

resetBtn.addEventListener("click", () => {
  if (confirm("❗ Réinitialiser tous les monstres et joueurs ?")) {
    monstres = [];
    localStorage.removeItem(monstresKey);
    localStorage.removeItem(joueursKey);
    localStorage.removeItem(ordreKey);
    combatLance = false;
    ordreUl.innerHTML = "";
    ordreTitre.style.display = "none";
    document.getElementById("zone-liste-temporaire").style.display = "block";
    listeMonstresDiv.innerHTML = "";
    listeJoueursDiv.innerHTML = "";
  }
});

lancerBtn.addEventListener("click", () => {
  const joueurs = JSON.parse(localStorage.getItem(joueursKey)) || [];
  const total = [...monstres, ...joueurs.filter(j => j.initiative > 0)];
  total.sort((a, b) => b.initiative - a.initiative);
  localStorage.setItem(ordreKey, JSON.stringify(total));

  ordreTitre.style.display = "block";
  document.getElementById("zone-liste-temporaire").style.display = "none";
  combatLance = true;
  afficherOrdre();
});

async function verifierNouveauxJoueurs() {
  if (!sessionId || combatLance) return;

  try {
    const response = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`);
    const data = await response.json();

    if (data?.joueurs) {
      const joueursActuels = JSON.parse(localStorage.getItem(joueursKey)) || [];

      data.joueurs.forEach((joueur) => {
        const existeDeja = joueursActuels.some(j => j.nom === joueur.pseudo);
        if (!existeDeja) {
          joueursActuels.push({ nom: joueur.pseudo, initiative: 0 });
        }
      });

      localStorage.setItem(joueursKey, JSON.stringify(joueursActuels));
      if (!combatLance) afficherListeTemporaire();
    }
  } catch (err) {
    console.error("Erreur récupération joueurs :", err);
  }
}
setInterval(verifierNouveauxJoueurs, 3000);

if (!combatLance) {
  afficherListeTemporaire();
}