if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');

window.onload = () => {
  loadUsersDropdown();
  
  const savedName = localStorage.getItem('dc_name');
  const savedPin = localStorage.getItem('dc_pin');
  
  if (savedName && savedPin) {
    showAppScreen(savedName, savedPin);
  } else {
    loginScreen.classList.remove('hidden');
  }
};

function loadUsersDropdown() {
  const selectMenu = document.getElementById('input-name');
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
  
  if(!name || !pin) return;

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
  document.getElementById('welcome-text').innerText = "Hallo " + name;
  
  try {
    const response = await fetch(APP_CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'getToday', pin: pin })
    });
    
    const data = await response.json();
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('challenge-card').classList.remove('hidden');

    if (data.error) {
      logout();
      return;
    }

    if (!data.challenge) {
      document.getElementById('challenge-waiting').classList.remove('hidden');
      document.getElementById('partner-name').innerText = "Niemand";
      return;
    }

    if (data.challenge.gebruiker === name) {
      document.getElementById('challenge-active').classList.remove('hidden');
      document.getElementById('cat-badge').innerText = data.challenge.categorie;
      document.getElementById('chal-text').innerText = data.challenge.challenge;
    } else {
      document.getElementById('challenge-waiting').classList.remove('hidden');
      document.getElementById('partner-name').innerText = data.challenge.gebruiker;
    }
    
  } catch (err) {
    logout();
  }

  async function rejectChallenge() {
  const name = localStorage.getItem('dc_name');
  const pin = localStorage.getItem('dc_pin');
  
  // Verberg de challenge en toon een specifieke laadtekst
  document.getElementById('challenge-card').classList.add('hidden');
  const loader = document.getElementById('loading');
  loader.classList.remove('hidden');
  loader.innerHTML = '<p class="animate-pulse font-light tracking-widest uppercase text-sm">Nieuwe challenge zoeken...</p>';
  
  try {
    await fetch(APP_CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'reject', pin: pin, user: name })
    });
    
    // Herstel de standaard laadtekst voor de volgende keer
    loader.innerHTML = '<p class="animate-pulse font-light tracking-widest uppercase text-sm">Bezig met synchroniseren...</p>';
    
    // Herlaad het scherm met de nieuwe data
    showAppScreen(name, pin);
    
  } catch (err) {
    alert("Er is een netwerkfout opgetreden.");
  }
}
}
