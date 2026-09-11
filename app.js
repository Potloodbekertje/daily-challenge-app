if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(console.error);
}

const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');

document.addEventListener('DOMContentLoaded', () => {
  loadUsersDropdown();
  
  const savedName = localStorage.getItem('dc_name');
  const savedPin = localStorage.getItem('dc_pin');
  
  if (savedName && savedPin) {
    showAppScreen(savedName, savedPin);
  } else {
    loginScreen.classList.remove('hidden');
    loginScreen.classList.add('fade-in');
  }
});

function loadUsersDropdown() {
  const selectMenu = document.getElementById('input-name');
  selectMenu.innerHTML = '<option value="" disabled selected>Selecteer je naam...</option>';
  
  APP_CONFIG.USERS.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.innerText = name;
    selectMenu.appendChild(option);
  });
}

function saveLogin() {
  const name = document.getElementById('input-name').value;
  const pin = document.getElementById('input-pin').value;
  
  if(!name || !pin) {
    alert("Vul aub je naam en pincode in.");
    return;
  }

  localStorage.setItem('dc_name', name);
  localStorage.setItem('dc_pin', pin);
  
  loginScreen.classList.add('hidden');
  showAppScreen(name, pin);
}

function logout() {
  localStorage.removeItem('dc_name');
  localStorage.removeItem('dc_pin');
  window.location.reload();
}

async function showAppScreen(name, pin) {
  appScreen.classList.remove('hidden');
  appScreen.classList.add('fade-in');
  document.getElementById('welcome-text').innerText = "Hallo " + name;
  
  try {
    const response = await fetch(APP_CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'getToday', pin: pin })
    });
    
    const data = await response.json();
    
    if (data.error) {
      alert("Foutmelding: " + data.error);
      if (data.error.includes("pincode")) logout();
      return;
    }

    // Verberg de lader en toon de kaart met een animatie
    document.getElementById('loading').classList.add('hidden');
    const card = document.getElementById('challenge-card');
    card.classList.remove('hidden');
    card.classList.add('fade-in');

    if (!data.challenge) {
      document.getElementById('challenge-active').classList.add('hidden');
      document.getElementById('challenge-waiting').classList.remove('hidden');
      document.getElementById('partner-name').innerText = "Niemand";
      return;
    }

    if (data.challenge.gebruiker === name) {
      document.getElementById('challenge-waiting').classList.add('hidden');
      document.getElementById('challenge-active').classList.remove('hidden');
      document.getElementById('cat-badge').innerText = data.challenge.categorie;
      document.getElementById('chal-text').innerText = data.challenge.challenge;
    } else {
      document.getElementById('challenge-active').classList.add('hidden');
      document.getElementById('challenge-waiting').classList.remove('hidden');
      document.getElementById('partner-name').innerText = data.challenge.gebruiker;
    }
    
  } catch (err) {
    console.error("Netwerkfout:", err);
    document.getElementById('loading-text').innerText = "Netwerkfout. Check je verbinding en ververs de app.";
  }
}

async function rejectChallenge() {
  const name = localStorage.getItem('dc_name');
  const pin = localStorage.getItem('dc_pin');
  
  document.getElementById('challenge-card').classList.add('hidden');
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('loading-text').innerText = "Nieuwe challenge zoeken...";
  
  try {
    const response = await fetch(APP_CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'reject', pin: pin, user: name })
    });
    
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('loading-text').innerText = "Bezig met synchroniseren...";
      showAppScreen(name, pin);
    } else {
      alert("Er ging iets mis: " + data.error);
      window.location.reload();
    }
    
  } catch (err) {
    alert("Er is een netwerkfout opgetreden bij het afwijzen.");
    window.location.reload();
  }
}
