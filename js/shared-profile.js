window.MICProfile = (() => {
  const STORAGE_KEY = "mic-training-profile";

  function load() {
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

  function initialsFromName(name) {
    if (!name) {
      return "TU";
    }

    const initials = name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");

    return initials || "TU";
  }

  function roleLabel(profile) {
    return profile?.roleName ? profile.roleName : "Rol libre de practica";
  }

  return {
    load,
    initialsFromName,
    roleLabel,
  };
})();
