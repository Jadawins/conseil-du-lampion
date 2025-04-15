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
  if (!data?.joueurs || !Array.isArray(data.joueurs)) return;

  // ✅ Sécurité : vérifier que l’index est bien dans la liste
  if (joueurIndexAModifier < 0 || joueurIndexAModifier >= data.joueurs.length) return;

  // ✅ Mise à jour du joueur
  data.joueurs[joueurIndexAModifier] = {
    ...data.joueurs[joueurIndexAModifier],
    pseudo: newNom,
    pv: newPV,
    initiative: newInit
  };

  // ✅ Log juste avant l'envoi
console.log("📦 Données envoyées :", JSON.stringify({
  sessionId,
  joueurs: data.joueurs
}, null, 2));

  // ✅ Envoi au backend
  const response = await fetch("https://lampion-api.azurewebsites.net/api/UpdateSession", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      joueurs: data.joueurs
    })
    
  });
  // ✅ Log de la réponse pour vérifier si tout s’est bien passé
  console.log("📨 Réponse API update:", response.status, await response.text());

  editJoueurModal.classList.add("hidden");
  afficherListeTemporaire();
});
  

function afficherListeTemporaire() {
  monstres = JSON.parse(localStorage.getItem(monstresKey)) || [];
  listeMonstresDiv.innerHTML = "";
  function afficherJoueurs(joueurs) {
    const tableExistante = listeJoueursDiv.querySelector("table");
    if (!tableExistante) {
      // Créer la table au premier affichage
      const table = document.createElement("table");
      table.className = "table-monstres";
  
      const thead = document.createElement("thead");
      thead.innerHTML = `
        <tr>
          <th>🧝 Joueur</th>
          <th>❤️ PV</th>
          <th>⚔️ Initiative</th>
          <th>🪄 Modifier</th>
        </tr>
      `;
      table.appendChild(thead);
  
      const tbody = document.createElement("tbody");
      table.appendChild(tbody);
      listeJoueursDiv.appendChild(table);
    }
  
    const tbody = listeJoueursDiv.querySelector("table tbody");
    tbody.innerHTML = ""; // <--- uniquement le contenu, pas tout le tableau
  
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
  
      tbody.appendChild(tr);
    });
  }

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
    afficherJoueurs(joueurs);
    
  });
};

resetBtn.addEventListener("click", () => {
  if (confirm("❗ Réinitialiser uniquement les monstres ?")) {
    monstres = [];
    localStorage.removeItem(monstresKey);
    ordreUl.innerHTML = "";
    ordreTitre.style.display = "none";
    combatLance = false;
    afficherListeTemporaire(); // recharge l'affichage à jour sans toucher aux joueurs
  }
});

lancerBtn.addEventListener("click", async () => {
  const data = await recupererSessionDepuisAPI(sessionId);
  const joueurs = data?.joueurs || [];
  const monstres = JSON.parse(localStorage.getItem(monstresKey)) || [];

  // Fusion et tri
  const total = [...monstres, ...joueurs].sort((a, b) => {
    if (b.initiative === a.initiative) {
      return a.pseudo?.localeCompare(b.pseudo) || a.nom?.localeCompare(b.nom) || 0;
    }
    return b.initiative - a.initiative;
  });

  localStorage.setItem(ordreKey, JSON.stringify(total));
  localStorage.setItem("indexTour-" + sessionId, "0");

  // Redirection vers mj-bagarre
  window.location.href = `mj-bagarre.html?sessionId=${sessionId}`;
});

if (!combatLance) {
  afficherListeTemporaire();
}

setInterval(() => {
  if (!combatLance) {
    afficherListeTemporaire();
  }
}, 5000); // 5000 ms = 3 secondes