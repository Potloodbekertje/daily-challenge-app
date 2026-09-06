window.onload = () => {
  loadUsersDropdown(); // <--- Deze regel is nieuw
  
  const savedName = localStorage.getItem('dc_name');
  const savedPin = localStorage.getItem('dc_pin');
  
  if (savedName && savedPin) {
    showAppScreen(savedName, savedPin);
  } else {
    loginScreen.classList.remove('hidden');
  }
};

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');

window.onload = () => {
  const savedName = localStorage.getItem('dc_name');
  const savedPin = localStorage.getItem('dc_pin');
  
  if (savedName && savedPin) {
    showAppScreen(savedName, savedPin);
  } else {
    loginScreen.classList.remove('hidden');
  }
};

function saveLogin() {
  const name = document.getElementById('input-name').value;
  const pin = document.getElementById('input-pin').value;
  
  if(!name || !pin) return;

  localStorage.setItem('dc_name', name);
  localStorage.setItem('dc_pin', pin);
  
  loginScreen.classList.add('hidden');
  showAppScreen(name, pin);
}

function loadUsersDropdown() {
  const selectMenu = document.getElementById('input-name');
  APP_CONFIG.USERS.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.innerText = name;
    selectMenu.appendChild(option);
  });
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
}