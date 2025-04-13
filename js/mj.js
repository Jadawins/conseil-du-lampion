// ⚙️ mj.js – version corrigée avec gestion d’erreur JSON robuste
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
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ nomAventure }) // ✅ Envoi dans le corps
    });

    // 🔍 Gestion intelligente des erreurs (texte ou JSON)
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      throw new Error(isJson ? (data.error || JSON.stringify(data)) : data);
    }

    if (!data.sessionId) {
      throw new Error("Réponse API invalide (sessionId manquant)");
    }

    // ✅ Sauvegarde minimale
    localStorage.setItem("sessionId", data.sessionId);

    // ✅ Redirection vers la session MJ (le nom sera récupéré depuis GetSession)
    window.location.href = `mj-session.html?sessionId=${data.sessionId}`;
  } catch (error) {
    console.error("❌ Erreur API :", error);
    messageEl.textContent = "❌ " + error.message;
  }
});