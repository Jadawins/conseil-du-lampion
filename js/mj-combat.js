const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get("sessionId");
const nomAventure = urlParams.get("nomAventure");

document.getElementById("titre-aventure").textContent = `⚔️ ${nomAventure}`;
document.getElementById("session-id-display").textContent = `🆔 Session ID : ${sessionId}`;

const form = document.getElementById("form-combat");
const ordreUl = document.getElementById("ordre");
const resetBtn = document.getElementById("reset");
const lancerBtn = document.getElementById("lancer");

let monstres = [];
let joueursAffiches = new Set();
let joueursSession = []; // Ne plus stocker en localStorage

// ➕ Ajouter un monstre manuellement
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const nom = document.getElementById("nom").value;
  const initiative = parseInt(document.getElementById("initiative").value);

  monstres.push({ nom, initiative });
  localStorage.setItem("monstresLampion", JSON.stringify(monstres));
  afficherOrdre();
  form.reset();
});

// 🔄 Réinitialiser la session
resetBtn.addEventListener("click", () => {
  if (confirm("Es-tu sûr de vouloir tout effacer ?")) {
    monstres = [];
    localStorage.removeItem("monstresLampion");
    localStorage.removeItem("ordreFinal");
    joueursAffiches.clear();
    joueursSession = [];
    afficherOrdre();
  }
});

// 🔥 Lancer le combat → publier l'ordre final
lancerBtn.addEventListener("click", () => {
  const total = [...monstres, ...joueursSession];
  total.sort((a, b) => b.initiative - a.initiative);

  localStorage.setItem("ordreFinal", JSON.stringify(total));
  alert("🔥 L'ordre de tour a été validé et envoyé aux joueurs !");
});

// 🧠 Afficher l'ordre d'initiative
function afficherOrdre() {
  ordreUl.innerHTML = "";

  const total = [...monstres, ...joueursSession];
  total.sort((a, b) => b.initiative - a.initiative);

  total.forEach((p) => {
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
        joueursSession.push({ nom: joueur.pseudo, initiative: null }); // Initiative null tant que non défini
      });

      afficherOrdre();
    }
  } catch (err) {
    console.error("Erreur lors de la récupération des joueurs :", err);
  }
}

// 🔁 Rafraîchir toutes les 3 secondes
setInterval(verifierNouveauxJoueurs, 3000);

// 💾 Recharger les monstres existants
const monstresSauvegardes = localStorage.getItem("monstresLampion");
if (monstresSauvegardes) {
  monstres = JSON.parse(monstresSauvegardes);
}
afficherOrdre();
