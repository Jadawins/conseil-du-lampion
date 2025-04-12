const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get("sessionId");
const nomAventure = urlParams.get("nomAventure");

document.getElementById("titre-aventure").textContent = `⚔️ ${nomAventure}`;
document.getElementById("session-id-display").textContent = `🆔 Session ID : ${sessionId}`;

const form = document.getElementById("form-combat");
const ordreUl = document.getElementById("ordre");
const resetBtn = document.getElementById("reset");
const lancerBtn = document.getElementById("lancer");
const ordreTitre = document.getElementById("ordre-titre");

let monstres = JSON.parse(localStorage.getItem("monstresLampion")) || [];
let joueursAffiches = new Set();
let combatLance = false;

function afficherOrdre() {
  ordreUl.innerHTML = "";

  const joueurs = JSON.parse(localStorage.getItem("joueursLampion")) || [];
  const total = [...monstres];

  if (combatLance) {
    total.push(...joueurs.filter(p => typeof p.initiative === "number" && p.initiative > 0));
  }

  total.sort((a, b) => b.initiative - a.initiative);

  total.forEach((p, index) => {
    const li = document.createElement("li");
    const isMonstre = monstres.findIndex(m => m.nom === p.nom) !== -1;
    li.innerHTML = `
      <strong>${p.nom}</strong> – Initiative : ${
        isMonstre
          ? `<input type="number" value="${p.initiative}" data-index="${index}" class="initiative-input" style="width: 60px;" />`
          : `<span>${p.initiative}</span>`
      }
      ${isMonstre ? `<button class="btn-danger" data-suppr="${index}">🗑️</button>` : ""}
    `;
    ordreUl.appendChild(li);
  });

  ordreUl.querySelectorAll(".initiative-input").forEach(input => {
    input.addEventListener("change", (e) => {
      const i = parseInt(e.target.dataset.index);
      monstres[i].initiative = parseInt(e.target.value);
      localStorage.setItem("monstresLampion", JSON.stringify(monstres));
      afficherOrdre();
    });
  });

  ordreUl.querySelectorAll(".btn-danger").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const i = parseInt(e.target.dataset.suppr);
      monstres.splice(i, 1);
      localStorage.setItem("monstresLampion", JSON.stringify(monstres));
      afficherOrdre();
    });
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const nom = document.getElementById("nom").value.trim();
  const initiative = parseInt(document.getElementById("initiative").value);
  if (!nom || isNaN(initiative)) return;

  monstres.push({ nom, initiative });
  localStorage.setItem("monstresLampion", JSON.stringify(monstres));
  form.reset();
  if (combatLance) afficherOrdre();
});

resetBtn.addEventListener("click", () => {
  if (confirm("Réinitialiser la session ?")) {
    monstres = [];
    localStorage.removeItem("monstresLampion");
    localStorage.removeItem("joueursLampion");
    localStorage.removeItem("ordreFinal");
    joueursAffiches.clear();
    ordreUl.innerHTML = "";
    ordreTitre.style.display = "none";
    combatLance = false;
  }
});

lancerBtn.addEventListener("click", () => {
  const joueurs = JSON.parse(localStorage.getItem("joueursLampion")) || [];
  const total = [...monstres, ...joueurs.filter(p => typeof p.initiative === "number" && p.initiative > 0)];
  total.sort((a, b) => b.initiative - a.initiative);

  localStorage.setItem("ordreFinal", JSON.stringify(total));
  ordreTitre.style.display = "block";
  combatLance = true;
  afficherOrdre();
  alert("🔥 Ordre de tour validé !");
});

// Si des monstres ont déjà été ajoutés mais combat pas lancé, on n'affiche pas encore
if (localStorage.getItem("ordreFinal")) {
  ordreTitre.style.display = "block";
  combatLance = true;
  afficherOrdre();
}
