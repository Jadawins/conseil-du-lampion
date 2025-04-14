// ✅ joueur.js – gestion de l'entrée joueur

const form = document.getElementById("join-form");
const messageAccueil = document.getElementById("message-accueil");
const instruction = document.querySelector(".instruction");
const titre = document.getElementById("titre-principal");

let intervalId; // 🔁 Pour contrôler le check de session

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const pseudo = document.getElementById("pseudo").value.trim();
  const sessionId = document.getElementById("sessionId").value.trim();

  if (!pseudo || !sessionId) return;

  try {
    const response = await fetch("https://lampion-api.azurewebsites.net/api/JoinSession", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sessionId, pseudo })
    });

    if (response.ok) {
      localStorage.setItem("pseudo", pseudo);
      localStorage.setItem("sessionId", sessionId);

      await new Promise(resolve => setTimeout(resolve, 800));
      let nomAventure = "(Aventure mystère)";
      const sessionRes = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`);
      if (sessionRes.ok) {
        const data = await sessionRes.json();
        nomAventure = data?.nomAventure || nomAventure;
      }

      form.style.display = "none";
      instruction.style.display = "none";
      titre.innerHTML = `<img src="assets/img/d20.png" class="title-icon" alt="d20"> Bienvenue ${pseudo} <img src="assets/img/d20.png" class="title-icon" alt="d20">`;
      messageAccueil.innerHTML = `⏳ Merci d'avoir rejoint l'aventure "<strong>${nomAventure}</strong>". Veuillez patienter jusqu'à ce que le MJ démarre la session...`;
      messageAccueil.style.display = "block";

      // ✅ Lancement du check après inscription
      intervalId = setInterval(verifierDemarrageSession, 3000);
    } else {
      alert("Erreur lors de l'inscription à la session. Veuillez vérifier l'ID.");
    }
  } catch (err) {
    console.error("Erreur réseau :", err);
    alert("Impossible de rejoindre la session. Problème de connexion.");
  }
});

async function verifierDemarrageSession() {
  const sessionId = localStorage.getItem("sessionId");
  try {
    const response = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`);
    const data = await response.json();

    if (data?.sessionActive === true) {
      clearInterval(intervalId); // ⛔ Stop la vérification continue
      window.location.href = `joueur-initiative.html?sessionId=${sessionId}`;
    }
  } catch (err) {
    console.error("Erreur lors de la vérification du démarrage :", err);
  }
}
