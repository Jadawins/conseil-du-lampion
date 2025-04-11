const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get("sessionId");
const nomAventure = urlParams.get("nomAventure");

document.getElementById("titre-aventure").textContent = `⚔️ ${nomAventure}`;
const ordreUl = document.getElementById("ordre");
const form = document.getElementById("form-combat");
const resetBtn = document.getElementById("reset");
const lancerBtn = document.getElementById("lancer");
const logJoueurs = document.getElementById("log-joueurs");

let monstres = [];
let joueursActuels = [];

const sauvegardes = localStorage.getItem("monstresLampion");
if (sauvegardes) {
  monstres = JSON.parse(sauvegardes);
}
afficherOrdre();
pollSession(); // Lancer la récupération en boucle

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const nom = document.getElementById("nom").value;
  const initiative = parseInt(document.getElementById("initiative").value);

  monstres.push({ nom, initiative });
  localStorage.setItem("monstresLampion", JSON.stringify(monstres));
  afficherOrdre();
  form.reset();
});

resetBtn.addEventListener("click", () => {
  if (confirm("Es-tu sûr de vouloir tout effacer ?")) {
    monstres = [];
    localStorage.removeItem("monstresLampion");
    localStorage.removeItem("joueursLampion");
    localStorage.removeItem("ordreFinal");
    localStorage.removeItem("joueursAffiches");
    afficherOrdre();
    logJoueurs.innerHTML = "";
  }
});

lancerBtn.addEventListener("click", () => {
  const joueurs = JSON.parse(localStorage.getItem("joueursLampion")) || [];
  const total = [...monstres, ...joueurs];
  total.sort((a, b) => b.initiative - a.initiative);
  localStorage.setItem("ordreFinal", JSON.stringify(total));
  alert("🔥 L'ordre de tour a été validé et envoyé aux joueurs !");
});

function afficherOrdre() {
  ordreUl.innerHTML = "";
  const joueurs = JSON.parse(localStorage.getItem("joueursLampion")) || [];
  const total = [...monstres, ...joueurs];
  total.sort((a, b) => b.initiative - a.initiative);

  total.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = `${p.nom} - Initiative : ${p.initiative}`;
    ordreUl.appendChild(li);
  });
}

async function pollSession() {
  if (!sessionId) return;

  try {
    const res = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession?sessionName=${sessionId}`);
    if (!res.ok) throw new Error("Erreur API");
    const data = await res.json();
    const joueurs = data.joueurs || [];

    const nouveaux = joueurs.filter(j => !joueursActuels.find(ancien => ancien.pseudo === j.pseudo));
    joueursActuels = joueurs;

    nouveaux.forEach(joueur => {
      const li = document.createElement("li");
      li.textContent = `${joueur.pseudo} a rejoint la partie`;
      logJoueurs.appendChild(li);
    });

    localStorage.setItem("joueursLampion", JSON.stringify(joueurs));
    afficherOrdre();
  } catch (error) {
    console.error("Erreur lors de la récupération de la session :", error);
  }

  setTimeout(pollSession, 3000); // Réessaye dans 3 secondes
}
