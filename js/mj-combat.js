const form = document.getElementById("form-combat");
const ordreUl = document.getElementById("ordre");
const resetBtn = document.getElementById("reset");
const lancerBtn = document.getElementById("lancer");

// Récupération des paramètres d'URL
const params = new URLSearchParams(window.location.search);
const sessionId = params.get("sessionId");
const nomAventure = params.get("nomAventure");

// Affichage dynamique dans le titre et le code
document.getElementById("titre-aventure").textContent = `⚔️ ${nomAventure}`;
document.getElementById("session-code").textContent = `🆔 Code de session : ${sessionId}`;

// Initialisation
let monstres = [];
let joueursConnus = []; // Pour stocker les joueurs déjà connus
const logJoueurs = document.createElement("ul");
document.body.appendChild(logJoueurs);

// Charger les monstres enregistrés localement
const monstresSauvegardes = localStorage.getItem("monstresLampion");
if (monstresSauvegardes) {
  monstres = JSON.parse(monstresSauvegardes);
}
afficherOrdre();

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

// Ajouter un monstre
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const nom = document.getElementById("nom").value;
  const initiative = parseInt(document.getElementById("initiative").value);

  monstres.push({ nom, initiative });
  localStorage.setItem("monstresLampion", JSON.stringify(monstres));
  afficherOrdre();
  form.reset();
});

// Réinitialiser la session
resetBtn.addEventListener("click", () => {
  if (confirm("Es-tu sûr de vouloir tout effacer ?")) {
    monstres = [];
    localStorage.removeItem("monstresLampion");
    localStorage.removeItem("joueursLampion");
    localStorage.removeItem("ordreFinal");
    joueursConnus = [];
    afficherOrdre();
    logJoueurs.innerHTML = ""; // Réinitialise l'affichage des logs
  }
});

// Lancer le combat (enregistre l'ordre final)
lancerBtn.addEventListener("click", () => {
  const joueurs = JSON.parse(localStorage.getItem("joueursLampion")) || [];
  const total = [...monstres, ...joueurs];
  total.sort((a, b) => b.initiative - a.initiative);

  localStorage.setItem("ordreFinal", JSON.stringify(total));
  alert("🔥 L'ordre de tour a été validé et envoyé aux joueurs !");
});

// Fonction pour interroger l’API GetSession régulièrement
async function verifierNouveauxJoueurs() {
  try {
    const res = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession?sessionId=${sessionId}`);
    if (res.ok) {
      const data = await res.json();
      const nouveauxJoueurs = data.joueurs.filter(j => !joueursConnus.includes(j.pseudo));

      nouveauxJoueurs.forEach(j => {
        joueursConnus.push(j.pseudo);
        const li = document.createElement("li");
        li.textContent = `🎉 ${j.pseudo} a rejoint la partie !`;
        logJoueurs.appendChild(li);
      });

      localStorage.setItem("joueursLampion", JSON.stringify(data.joueurs));
      afficherOrdre();
    }
  } catch (err) {
    console.error("Erreur lors de la récupération de la session :", err);
  }
}

// Vérifie toutes les 3 secondes
setInterval(verifierNouveauxJoueurs, 3000);
