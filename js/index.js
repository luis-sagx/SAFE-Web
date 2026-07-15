const STORAGE_KEY = "mic-training-profile";

const accessCard = document.getElementById("accessCard");
const dashboard = document.getElementById("dashboard");
const accessForm = document.getElementById("accessForm");
const logoutBtn = document.getElementById("logoutBtn");
const welcomeTitle = document.getElementById("welcomeTitle");
const welcomeText = document.getElementById("welcomeText");
const displayNameInput = document.getElementById("displayName");
const roleNameInput = document.getElementById("roleName");

function loadProfile() {
  const raw = sessionStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function saveProfile(profile) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

function showDashboard(profile) {
  accessCard.classList.add("hidden");
  dashboard.classList.remove("hidden");

  const roleText = profile.roleName
    ? ` Perfil elegido: ${profile.roleName}.`
    : " No agregaste un rol o area, y esta bien para una simulacion simple.";

  welcomeTitle.textContent = `Bienvenido/a, ${profile.displayName}`;
  welcomeText.textContent =
    `Este entrenamiento es solo de practica. Puedes entrar a cualquiera de los cinco escenarios.${roleText}`;
}

function showAccessForm(profile = null) {
  dashboard.classList.add("hidden");
  accessCard.classList.remove("hidden");

  if (profile) {
    displayNameInput.value = profile.displayName || "";
    roleNameInput.value = profile.roleName || "";
  }

  displayNameInput.focus();
}

accessForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const displayName = displayNameInput.value.trim();
  const roleName = roleNameInput.value.trim();

  if (!displayName) {
    displayNameInput.focus();
    return;
  }

  const profile = { displayName, roleName };
  saveProfile(profile);
  showDashboard(profile);
});

logoutBtn.addEventListener("click", () => {
  const currentProfile = loadProfile();
  sessionStorage.removeItem(STORAGE_KEY);
  showAccessForm(currentProfile);
});

const profile = loadProfile();

if (profile?.displayName) {
  showDashboard(profile);
} else {
  showAccessForm();
}
