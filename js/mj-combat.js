const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get("sessionId");
const nomAventure = urlParams.get("nomAventure");

document.getElementById("titre-aventure").textContent = `⚔️ ${nomAventure}`;
document.getElementById("session-id-display").textContent = `🆔 Session ID : ${sessionId}`;

const form = document.getElementById("form-combat");
const ordreUl = document.getElementById("ordre");
const initiativeSection = document.getElementById("initiative-section");
const resetBtn = document.getElementById("reset");
const lancerBtn = document.getElementById("lancer");

let monstres = [];
let joueursAffiches = new Set();
let joueursSession = [];

// ➕ Ajouter un monstre
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const nom = document.getElementById("nom").value;
  const initiative = parseInt(document.getElementById("initiative").value);

  monstres.push({ nom, initiative });
  localStorage.setItem("monstresLampion", JSON.stringify(monstres));
  form.reset();
});

// 🔄 Réinitialiser la session
resetBtn.addEventListener("click", () => {
  if (confirm("Es-tu sûr de vouloir tout effacer ?")) {
    monstres = [];
    joueursSession = [];
    joueursAffiches.clear();
    localStorage.removeItem("monstresLampion");
    localStorage.removeItem("ordreFinal");
    ordreUl.innerHTML = "";
    initiativeSection.style.display = "none";
  }
});

// 🔥 Lancer le combat → Affiche la section et l’ordre
lancerBtn.addEventListener("click", () => {
  initiativeSection.style.display = "block";
  const total = [...monstres, ...joueursSession].filter(p => p.initiative !== null);
  total.sort((a, b) => b.initiative - a.initiative);
  localStorage.setItem("ordreFinal", JSON.stringify(total));
  afficherOrdre(total);
  alert("🔥 L'ordre de tour a été validé et envoyé aux joueurs !");
});

// 🧠 Afficher l'ordre passé en paramètre
function afficherOrdre(participants) {
  ordreUl.innerHTML = "";
  participants.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = `${p.nom} - Initiative : ${p.initiative}`;
    ordreUl.appendChild(li);
  });
}

// 🔄 Vérifier les nouveaux joueurs dans le blob Azure
async function verifierNouveauxJoueurs() {
  if (!sessionId) return;

  try {
    const response = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`);
    const data = await response.json();

    if (data && data.joueurs) {
      const nouveaux = data.joueurs.filter(joueur => !joueursAffiches.has(joueur.pseudo));

      nouveaux.forEach(joueur => {
        console.log(`🧝 ${joueur.pseudo} a rejoint la partie.`);
        joueursAffiches.add(joueur.pseudo);
        joueursSession.push({ nom: joueur.pseudo, initiative: null });
      });
    }
  } catch (err) {
    console.error("Erreur lors de la récupération des joueurs :", err);
  }
}

// 🔁 Rafraîchir toutes les 3 secondes
setInterval(verifierNouveauxJoueurs, 3000);

// 💾 Recharger les monstres
const monstresSauvegardes = localStorage.getItem("monstresLampion");
if (monstresSauvegardes) {
  monstres = JSON.parse(monstresSauvegardes);
}
