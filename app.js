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
  localStorage.removeItem('dc_date');
  localStorage.removeItem('dc_challenge_data');
  window.location.reload();
}

// Hulpfunctie om het scherm op te bouwen (voorkomt dubbele code)
function renderChallengeUI(data, name) {
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
}

async function showAppScreen(name, pin) {
  appScreen.classList.remove('hidden');
  appScreen.classList.add('fade-in');
  document.getElementById('welcome-text').innerText = "Hallo " + name;
  
  // Controleer welke dag het vandaag is
  const todayStr = new Date().toDateString();
  const cachedDate = localStorage.getItem('dc_date');
  const cachedData = localStorage.getItem('dc_challenge_data');

  // Als we vandaag al data hebben opgehaald, gebruik deze dan direct!
  if (cachedDate === todayStr && cachedData) {
    renderChallengeUI(JSON.parse(cachedData), name);
    return; // Stop het script, we hoeven niet naar Google te bellen
  }
  
  // Zo niet (nieuwe dag, of eerste keer laden), haal op bij Google
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

    // Sla de opgehaalde data op in het geheugen voor de rest van de dag
    localStorage.setItem('dc_date', todayStr);
    localStorage.setItem('dc_challenge_data', JSON.stringify(data));

    renderChallengeUI(data, name);
    
  } catch (err) {
    console.error("Netwerkfout:", err);
    // Vangnet: Als je in een bos bent zonder 4G, maar je had vanmorgen wel de app geopend, 
    // laat hij alsnog de gecachte challenge zien.
    if (cachedData) {
       renderChallengeUI(JSON.parse(cachedData), name);
    } else {
       document.getElementById('loading-text').innerText = "Netwerkfout. Check je verbinding en ververs de app.";
    }
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
      
      // Cruciaal: Gooi het lokale geheugen weg, zodat de app dwingt om 
      // de verse, nieuwe challenge bij Google op te halen
      localStorage.removeItem('dc_date');
      localStorage.removeItem('dc_challenge_data');
      
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
