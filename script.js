/* ============================================
   WEB AUDIO API ZA RETRO ZVUKOVE (lazy init)
   ============================================ */
let audioCtx = null;

function getAudioCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function playBeep(frequency = 440, duration = 0.05, type = 'square') {
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (err) {
        console.warn('Zvuk nije dostupan:', err);
    }
}

/* ============================================
   LIVE SAT
   ============================================ */
function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('live-clock');
    if (clockEl) {
        clockEl.textContent = now.toTimeString().split(' ')[0];
    }
}
updateClock();
setInterval(updateClock, 1000);

/* ============================================
   POKRETANJE SISTEMA (Intro -> Desktop)
   ============================================ */
const startBtn = document.getElementById('start-btn');
const introScreen = document.getElementById('intro-screen');
const mainDesktop = document.getElementById('main-desktop');

if (startBtn) {
    startBtn.addEventListener('click', () => {
        playBeep(600, 0.1);
        introScreen.style.opacity = '0';
        setTimeout(() => {
            introScreen.style.display = 'none';
            mainDesktop.classList.remove('hidden');
            setTimeout(() => {
                mainDesktop.style.opacity = '1';
            }, 50);
        }, 700);
    });
}

/* ============================================
   UPRAVLJANJE PROZORIMA (sa dinamičkim z-index-om)
   ============================================ */
let topZIndex = 50;

function openWindow(windowId) {
    playBeep(520, 0.08);
    const win = document.getElementById(windowId);
    if (!win) return;
    win.classList.remove('hidden');

    topZIndex++;
    win.style.zIndex = topZIndex;
}

function closeWindow(windowId) {
    playBeep(300, 0.08);
    const win = document.getElementById(windowId);
    if (!win) return;
    win.classList.add('hidden');
}

/* ============================================
   POMERANJE PROZORA (miš + touch, sa ograničenjem)
   ============================================ */
let activeWindow = null;
let offsetX = 0, offsetY = 0;

function initDrag(e) {
    const modalBox = e.target.closest('.fixed');
    if (!modalBox) return;

    activeWindow = modalBox.querySelector('.draggable-window');
    if (!activeWindow) return;

    const rect = activeWindow.getBoundingClientRect();

    activeWindow.style.position = 'absolute';
    activeWindow.style.left = rect.left + 'px';
    activeWindow.style.top = rect.top + 'px';

    topZIndex++;
    modalBox.style.zIndex = topZIndex;

    const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);

    offsetX = clientX - rect.left;
    offsetY = clientY - rect.top;

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', stopDrag);
}

function onDrag(e) {
    if (!activeWindow) return;

    const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);

    let newX = clientX - offsetX;
    let newY = clientY - offsetY;

    const minVisible = 60;
    const maxX = window.innerWidth - minVisible;
    const maxY = window.innerHeight - minVisible;
    const minX = -activeWindow.offsetWidth + minVisible;

    newX = Math.max(minX, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    activeWindow.style.left = newX + 'px';
    activeWindow.style.top = newY + 'px';

    if (e.type === 'touchmove') {
        e.preventDefault();
    }
}

function stopDrag() {
    activeWindow = null;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', stopDrag);
}

/* ============================================
   ZATVARANJE PROZORA PRITISKOM NA ESC
   ============================================ */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('[id$="-window"]:not(.hidden)').forEach(w => {
            closeWindow(w.id);
        });
    }
});

/* ============================================
   MINI TERMINAL
   ============================================ */
function handleTerminal(e) {
    if (e.key === 'Enter') {
        playBeep(700, 0.04);
        const input = document.getElementById('terminal-input');
        const output = document.getElementById('terminal-output');
        const val = input.value.trim().toLowerCase();

        let response = `> Nepoznata komanda: "${val}". Ukucaj "help".`;
        if (val === 'help') {
            response = `> Dostupne komande: about, skills, projects, contact, clear`;
        } else if (val === 'about') {
            openWindow('about-window');
            response = `> Otvaram prozor: O meni`;
        } else if (val === 'skills') {
            openWindow('skills-window');
            response = `> Otvaram prozor: Skill tree`;
        } else if (val === 'projects') {
            openWindow('projects-window');
            response = `> Otvaram prozor: Projekti`;
        } else if (val === 'contact') {
            openWindow('contact-window');
            response = `> Otvaram prozor: Kontakt`;
        } else if (val === 'clear') {
            response = `> Terminal očišćen.`;
        }

        output.textContent = response;
        input.value = '';
    }
}

/* ============================================
   PREVOD SR / EN (+ localStorage)
   ============================================ */
let currentLang = 'sr';
const translations = {
    sr: {
        intro_title: "BOGDAN OS v1.0",
        icon_about: "O meni",
        icon_skills: "Skill tree",
        icon_projects: "Projekti",
        icon_contact: "Kontakt",
        about_subtitle: "Full-Stack Developer & UI/UX Designer",
        about_text: "Kombinujem estetiku grafičkog dizajna i logiku programiranja. Gradim brza, moderna i unikatna web rešenja od nule, sa posebnim akcentom na detalje i korisničko iskustvo.",
        proj_desc1: "Moderan interfejs razvijen sa fokusom na performanse, prilagođen za sve uređaje.",
        proj_desc2: "Backend arhitektura povezana sa bazom podataka i dinamičkim rutama.",
        contact_text: "Stupi u kontakt sa mnom:"
    },
    en: {
        intro_title: "BOGDAN OS v1.0",
        icon_about: "About me",
        icon_skills: "Skill tree",
        icon_projects: "Projects",
        icon_contact: "Contact",
        about_subtitle: "Full-Stack Developer & UI/UX Designer",
        about_text: "I combine graphic design aesthetics with programming logic. I build fast, modern, and unique web solutions from scratch, with a strong focus on details and user experience.",
        proj_desc1: "Modern interface developed with a focus on performance, optimized for all devices.",
        proj_desc2: "Backend architecture connected with database systems and dynamic routing.",
        contact_text: "Get in touch with me:"
    }
};

const langBtn = document.getElementById('lang-btn');

function applyLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    langBtn.textContent = lang === 'sr' ? 'EN / SR' : 'SR / EN';

    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    localStorage.setItem('preferredLang', lang);
}

langBtn.addEventListener('click', () => {
    playBeep(800, 0.05);
    const newLang = currentLang === 'sr' ? 'en' : 'sr';
    applyLanguage(newLang);
});

const savedLang = localStorage.getItem('preferredLang');
if (savedLang && translations[savedLang]) {
    applyLanguage(savedLang);
}