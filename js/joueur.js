// ✅ joueur.js – gestion de l'entrée joueur

const form = document.getElementById("join-form");
const messageAccueil = document.getElementById("message-accueil");
const instruction = document.querySelector(".instruction");
const titre = document.getElementById("titre-principal");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const pseudo = document.getElementById("pseudo").value.trim();
  const sessionId = document.getElementById("sessionId").value.trim();

  if (!pseudo || !sessionId) return;

  try {
    // 🔄 Nouvelle méthode : POST avec JSON body
    const response = await fetch("https://lampion-api.azurewebsites.net/api/JoinSession", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sessionId: sessionId, // ✅ le bon nom !
        pseudo: pseudo
      })
    });

    if (response.ok) {
      // Sauvegarde locale
      localStorage.setItem("pseudo", pseudo);
      localStorage.setItem("sessionId", sessionId);

      // 🎯 Récupération du nom d’aventure
      await new Promise(resolve => setTimeout(resolve, 800));
      let nomAventure = "(Aventure mystère)";
      const sessionRes = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`);
      if (sessionRes.ok) {
        const data = await sessionRes.json();
        nomAventure = data?.nomAventure || nomAventure;
      }

      // 🎉 Affichage personnalisé
      form.style.display = "none";
      instruction.style.display = "none";
      titre.innerHTML = `<img src="assets/img/d20.png" class="title-icon" alt="d20"> Bienvenue ${pseudo} <img src="assets/img/d20.png" class="title-icon" alt="d20">`;
      messageAccueil.innerHTML = `⏳ Merci d'avoir rejoint l'aventure "<strong>${nomAventure}</strong>". Veuillez patienter jusqu'à ce que le MJ démarre la session...`;
      messageAccueil.style.display = "block";
    } else {
      alert("Erreur lors de l'inscription à la session. Veuillez vérifier l'ID.");
    }
  } catch (err) {
    console.error("Erreur réseau :", err);
    alert("Impossible de rejoindre la session. Problème de connexion.");
  }
});

