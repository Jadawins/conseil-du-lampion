const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('sessionId');
const pseudo = localStorage.getItem("pseudo");

document.getElementById('initiative-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const initiative = parseInt(document.getElementById('initiative-input').value);
  const pv = parseInt(document.getElementById('pv-input').value);

  if (isNaN(initiative) || isNaN(pv)) return;

  try {
    await fetch(`https://lampion-api.azurewebsites.net/api/SetInitiative`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, pseudo, initiative, pv })
    });

    document.getElementById('initiative-form').style.display = 'none';
    document.getElementById('initiative-title').style.display = 'none';
    document.getElementById('confirmation-message').style.display = 'block';
  } catch (err) {
    alert("Erreur lors de l'enregistrement de l'initiative.");
  }
});
