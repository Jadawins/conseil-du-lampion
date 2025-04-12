const btnCreerSession = document.getElementById("btn-creer-session");

btnCreerSession.addEventListener("click", async () => {
  const nomAventure = document.getElementById("nom-aventure").value.trim();
  const messageEl = document.getElementById("message");

  if (!nomAventure) {
    messageEl.textContent = "⚠️ Merci d’entrer un nom pour l’aventure.";
    return;
  }

  try {
    const response = await fetch("https://lampion-api.azurewebsites.net/api/CreateSession", {
      method: "POST"
    });

    const data = await response.json();

    if (!response.ok || !data.sessionId) {
      throw new Error("Réponse API invalide");
    }

    localStorage.setItem("sessionId", data.sessionId);
    localStorage.setItem("nomAventure", nomAventure);

    window.location.href = `mj-session.html?sessionId=${data.sessionId}&nomAventure=${encodeURIComponent(nomAventure)}`;
  } catch (error) {
    console.error("❌ Erreur de communication avec l’API :", error);
    messageEl.textContent = "❌ Impossible de créer la session. Vérifie ta connexion ou l’API.";
  }
});
