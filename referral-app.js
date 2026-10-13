(() => {
  const PROFILE_KEY = "eye-solar-demo-profile-v1";
  const profilesKey = "eye-solar-demo-local-invites-v1";
  const form = document.getElementById("join-form");
  const nameField = document.getElementById("display-name");
  const inviteField = document.getElementById("invite-code");
  const message = document.getElementById("join-message");
  const codeBox = document.getElementById("my-code");
  const detail = document.getElementById("profile-detail");
  const copyBtn = document.getElementById("copy-code");
  const copyMessage = document.getElementById("copy-message");
  const makeCode = () => "EYE-" + Array.from(crypto.getRandomValues(new Uint8Array(5))).map(n => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[n % 32]).join("");
  const getProfiles = () => { try { return JSON.parse(localStorage.getItem(profilesKey) || "{}"); } catch { return {}; } };
  const show = profile => {
    if (!profile) return;
    codeBox.textContent = profile.code;
    detail.textContent = "Profile: " + profile.name + (profile.invitedBy ? " · Joined using " + profile.invitedBy : "");
    copyBtn.disabled = false;
    nameField.value = profile.name;
  };
  let profile = null;
  try { profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null"); } catch {}
  if (profile && profile.code) show(profile);
  const params = new URLSearchParams(location.search);
  if (params.get("ref")) inviteField.value = params.get("ref").slice(0,24);
  form.addEventListener("submit", event => {
    event.preventDefault();
    const name = nameField.value.trim();
    const invite = inviteField.value.trim().toUpperCase();
    if (!name) { message.textContent = "Please enter a display name."; return; }
    const profiles = getProfiles();
    if (invite && !Object.values(profiles).some(p => p.code === invite)) {
      message.textContent = "That code is not found in this browser's demo records. Cross-device code verification is not available yet.";
      return;
    }
    const code = profile?.code || makeCode();
    profile = {name, code, invitedBy: invite || "", createdAt: profile?.createdAt || new Date().toISOString()};
    profiles[code] = profile;
    localStorage.setItem(profilesKey, JSON.stringify(profiles));
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    message.textContent = "Demo profile saved in this browser. This is not a secure, shared account.";
    show(profile);
  });
  copyBtn.addEventListener("click", async () => {
    if (!profile) return;
    const url = new URL("join.html", location.href);
    url.searchParams.set("ref", profile.code);
    try { await navigator.clipboard.writeText(url.href); copyMessage.textContent = "Invite link copied."; }
    catch { copyMessage.textContent = url.href; }
  });
})();