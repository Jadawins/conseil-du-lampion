// 📜 Paramètres d'URL
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get("sessionId");
const nomAventure = urlParams.get("nomAventure");

document.getElementById("titre-aventure").textContent = `⚔️ ${nomAventure}`;
document.getElementById("session-id-display").textContent = `🆔 Session ID : ${sessionId}`;

const form = document.getElementById("form-combat");
const listeMonstresDiv = document.getElementById("liste-monstres");
const listeJoueursDiv = document.getElementById("liste-joueurs");
const ordreUl = document.getElementById("ordre");
const ordreTitre = document.getElementById("ordre-titre");
const resetBtn = document.getElementById("reset");
const lancerBtn = document.getElementById("lancer");

let monstres = JSON.parse(localStorage.getItem("monstresLampion")) || [];
let joueursAffiches = new Set();
let combatLance = false;

// 🔁 Affichage liste temporaire (avant le combat)
function afficherListeTemporaire() {
  listeMonstresDiv.innerHTML = "";
  listeJoueursDiv.innerHTML = "";

  // Monstres
  monstres.forEach((m, index) => {
    const div = document.createElement("div");
    div.className = "monstre-item";
    div.innerHTML = `
      <span class="nom-monstre"><strong>${m.nom}</strong></span>
      <input type="number" value="${m.initiative}" data-index="${index}" class="initiative-input" />
    <button class="btn-danger" data-suppr="${index}">🗑️</button>
`   ;
    listeMonstresDiv.appendChild(div);
  });

  // Mise à jour des initiatives
  listeMonstresDiv.querySelectorAll(".initiative-input").forEach(input => {
    input.addEventListener("change", (e) => {
      const i = parseInt(e.target.dataset.index);
      monstres[i].initiative = parseInt(e.target.value);
      localStorage.setItem("monstresLampion", JSON.stringify(monstres));
    });
  });

  // Suppression
  listeMonstresDiv.querySelectorAll(".btn-danger").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const i = parseInt(e.target.dataset.suppr);
      monstres.splice(i, 1);
      localStorage.setItem("monstresLampion", JSON.stringify(monstres));
      afficherListeTemporaire();
    });
  });

  // Joueurs
  const joueurs = JSON.parse(localStorage.getItem("joueursLampion")) || [];
  joueurs.forEach(j => {
    const div = document.createElement("div");
    div.className = "joueur-item";
    div.innerHTML = `<strong>${j.nom}</strong> – Initiative : ${j.initiative}`;
    listeJoueursDiv.appendChild(div);
  });
}

// 🧠 Afficher l'ordre d'initiative (après lancement)
function afficherOrdre() {
  ordreUl.innerHTML = "";
  const joueurs = JSON.parse(localStorage.getItem("joueursLampion")) || [];
  const total = [...monstres, ...joueurs.filter(j => j.initiative > 0)];
  total.sort((a, b) => b.initiative - a.initiative);

  total.forEach(p => {
    const li = document.createElement("li");
    li.textContent = `${p.nom} – Initiative : ${p.initiative}`;
    ordreUl.appendChild(li);
  });
}

// ➕ Ajouter un monstre
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const nom = document.getElementById("nom-monstre").value.trim();
  const initiative = parseInt(document.getElementById("initiative-monstre").value);
  // Vérifie si le nom existe déjà
const existeDeja = monstres.some(monstre => monstre.nom.toLowerCase() === nom.toLowerCase());
if (existeDeja) {
  alert("⚠️ Un monstre avec ce nom existe déjà !");
  return;
}
  if (!nom || isNaN(initiative)) return;

  monstres.push({ nom, initiative });
  localStorage.setItem("monstresLampion", JSON.stringify(monstres));
  form.reset();
  if (!combatLance) afficherListeTemporaire();
});

// 🔄 Réinitialiser
resetBtn.addEventListener("click", () => {
  if (confirm("❗ Réinitialiser tous les monstres et joueurs ?")) {
    monstres = [];
    localStorage.removeItem("monstresLampion");
    localStorage.removeItem("joueursLampion");
    localStorage.removeItem("ordreFinal");
    combatLance = false;
    ordreUl.innerHTML = "";
    ordreTitre.style.display = "none";
    document.getElementById("zone-liste-temporaire").style.display = "block";
    listeMonstresDiv.innerHTML = "";
    listeJoueursDiv.innerHTML = "";
    joueursAffiches.clear();
  }
});

// 🔥 Lancer le combat
lancerBtn.addEventListener("click", () => {
  const joueurs = JSON.parse(localStorage.getItem("joueursLampion")) || [];
  const total = [...monstres, ...joueurs.filter(j => j.initiative > 0)];
  total.sort((a, b) => b.initiative - a.initiative);
  localStorage.setItem("ordreFinal", JSON.stringify(total));

  ordreTitre.style.display = "block";
  document.getElementById("zone-liste-temporaire").style.display = "none";
  combatLance = true;
  afficherOrdre();
});

// 🔁 Vérifier nouveaux joueurs (toutes les 3s)
async function verifierNouveauxJoueurs() {
  if (!sessionId || combatLance) return;

  try {
    const response = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`);
    const data = await response.json();

    if (data?.joueurs) {
      const joueursActuels = JSON.parse(localStorage.getItem("joueursLampion")) || [];

      data.joueurs.forEach((joueur) => {
        if (!joueursAffiches.has(joueur.pseudo)) {
          joueursAffiches.add(joueur.pseudo);
          joueursActuels.push({ nom: joueur.pseudo, initiative: 0 });
        }
      });

      localStorage.setItem("joueursLampion", JSON.stringify(joueursActuels));
      if (!combatLance) afficherListeTemporaire();
    }
  } catch (err) {
    console.error("Erreur récupération joueurs :", err);
  }
}
setInterval(verifierNouveauxJoueurs, 3000);

// 🔄 Init
if (!combatLance) {
  afficherListeTemporaire();
}
