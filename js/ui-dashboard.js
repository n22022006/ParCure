(function(){// UI interactions for ParCure dashboard













































})();  }    if (el) el.addEventListener('click', ()=>{ actions[id](); closeMenu(); });    const el = document.getElementById(id);  for (const id in actions){  };    }      window.location.href = 'index2.html';      try { localStorage.removeItem('pc_user_name'); } catch {}    menuLogout: ()=> {    menuContact: ()=> alert('Contact us at support@parcure.health'),    menuHelp: ()=> alert('Help & Support coming soon'),    menuEditAccount: ()=> window.location.href = 'index2.html',    menuViewProfile: ()=> window.location.href = 'onboarding-step1.html',  const actions = {  // Menu item actions  });    if (dropdown.classList.contains('open')) closeMenu(); else openMenu();    e.stopPropagation();  avatarBtn.addEventListener('click', (e)=>{  }    if (e.key === 'Escape') closeMenu();  function handleEsc(e){  }    }      closeMenu();    if (!dropdown.contains(e.target) && e.target !== avatarBtn){  function handleOutside(e){  }    document.removeEventListener('keydown', handleEsc);    avatarBtn.setAttribute('aria-expanded','false');    dropdown.classList.remove('open');  function closeMenu(){  }    document.addEventListener('keydown', handleEsc);    document.addEventListener('click', handleOutside, { once: true });    avatarBtn.setAttribute('aria-expanded','true');    dropdown.classList.add('open');  function openMenu(){  if (!avatarBtn || !dropdown) return;  const dropdown = document.getElementById('pcDropdown');  const avatarBtn = document.getElementById('pcAvatarBtn');(function(){
  const dropdown = document.getElementById('pcDropdown');
  const avatarBtn = document.getElementById('pcAvatarBtn');
  let open = false;

  function openMenu(){
    if (!dropdown) return;
    dropdown.classList.add('open');
    avatarBtn?.setAttribute('aria-expanded','true');
    open = true;
    document.addEventListener('click', handleOutside, { capture: true });
    document.addEventListener('keydown', handleKeys);
  }
  function closeMenu(){
    if (!dropdown) return;
    dropdown.classList.remove('open');
    avatarBtn?.setAttribute('aria-expanded','false');
    open = false;
    document.removeEventListener('click', handleOutside, { capture: true });
    document.removeEventListener('keydown', handleKeys);
  }
  function handleOutside(e){
    if (!dropdown) return;
    if (avatarBtn && avatarBtn.contains(e.target)) return;
    if (!dropdown.contains(e.target)) closeMenu();
  }
  function handleKeys(e){
    if (e.key === 'Escape') closeMenu();
  }

  avatarBtn?.addEventListener('click', () => {
    open ? closeMenu() : openMenu();
  });

  // Menu items
  const viewProfile = document.getElementById('menuViewProfile');
  const editAccount = document.getElementById('menuEditAccount');
  const help = document.getElementById('menuHelp');
  const contact = document.getElementById('menuContact');
  const logout = document.getElementById('menuLogout');

  viewProfile?.addEventListener('click', () => { closeMenu(); window.location.href = 'onboarding-step1.html'; });
  editAccount?.addEventListener('click', () => { closeMenu(); window.location.href = 'onboarding-step1.html'; });
  help?.addEventListener('click', () => { closeMenu(); alert('Help & Support coming soon'); });
  contact?.addEventListener('click', () => { closeMenu(); alert('Contact us at support@parcure.example'); });
  logout?.addEventListener('click', () => {
    closeMenu();
    try { localStorage.removeItem('pc_user_name'); } catch(e){}
    window.location.href = 'index2.html';
  });
})();
