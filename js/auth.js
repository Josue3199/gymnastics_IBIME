// =================================================================
// IBIME GYMNASTICS CLUB — Módulo de Autenticación
// auth.js: Firebase init, login unificado con roles, dashboard navigation
// =================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged }
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, where }
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ══════════ FIREBASE CONFIG ══════════
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBxBmuQY5n5ecf5Vy6vLPu_qKP726IaLzs",
    authDomain: "gymnastics-club-by-ibime.firebaseapp.com",
    databaseURL: "https://gymnastics-club-by-ibime-default-rtdb.firebaseio.com/",
    projectId: "gymnastics-club-by-ibime",
    appId: "1:849277925066:web:6ef91b240277fe24846633"
};

const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

// Exponer firebase compat globalmente para el módulo de clases (usa sintaxis v8)
if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
window.db = firebase.firestore();
window.firebase = firebase;
// Inicializar listeners de módulos que dependen de window.db
window.addEventListener('load', () => {
    if (typeof initClasesListeners === 'function') initClasesListeners();
});

// ══════════════════════════════════════════════════════════════
// BASE DE DATOS SIMULADA DE USUARIOS CON ROLES (para demo/testing)
// En producción los roles se obtienen de Firestore
// ══════════════════════════════════════════════════════════════
const USUARIOS_DEMO = {
    // Admin — acceso completo a todos los módulos
    'admin@gym.com': {
        password: 'admin123',
        rol: 'admin',
        nombre: 'Administrador General'
    },
    // Recepcionistas — acceso solo al módulo de recepción
    'recep1@gym.com': {
        password: 'recep123',
        rol: 'recepcion',
        nombre: 'María Recepción'
    },
    // Alumnos — acceso solo a su panel personal
    'alumno1@gym.com': {
        password: 'alumno123',
        rol: 'alumno',
        nombre: 'Juan Pérez',
        id: 'A001'
    },
    'alumno2@gym.com': {
        password: 'alumno123',
        rol: 'alumno',
        nombre: 'Ana García',
        id: 'A002'
    }
};

// ══════════════════════════════════════════════════════════════
// VERIFICAR SI ES USUARIO DEMO
// ══════════════════════════════════════════════════════════════
function checkDemoUser(emailOrId, password) {
    const emailLower = emailOrId.toLowerCase().trim();
    const user = USUARIOS_DEMO[emailLower];
    if (user && user.password === password) {
        return { ...user, email: emailLower };
    }
    return null;
}

let currentUser = null;
let currentUserData = null;

// ══════════ ELEMENTOS DOM ══════════
const loginScreen = document.getElementById('loginScreen');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const btnLogin = document.getElementById('btnLogin');
const btnLoginText = document.getElementById('btnLoginText');
const btnLoginSpinner = document.getElementById('btnLoginSpinner');

const userName = document.getElementById('userName');
const userRole = document.getElementById('userRole');
const createUserSection = document.getElementById('createUserSection');
const createUserForm = document.getElementById('createUserForm');
const createUserSuccess = document.getElementById('createUserSuccess');
const createUserError = document.getElementById('createUserError');
const btnCreateUser = document.getElementById('btnCreateUser');
const btnCreateUserText = document.getElementById('btnCreateUserText');
const btnCreateUserSpinner = document.getElementById('btnCreateUserSpinner');

// ══════════ AUTH STATE LISTENER ══════════
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        await loadUserData(user.uid);
    } else {
        // Only show login if no demo user is active
        if (!window._demoUser) {
            showLogin();
        }
    }
});

// ══════════ LOGIN UNIFICADO CON ROLES ══════════
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    hideError();
    setLoginLoading(true);

    // 1. Verificar primero usuarios demo
    const demoUser = checkDemoUser(emailInput, password);
    if (demoUser) {
        window._demoUser = demoUser;
        currentUserData = demoUser;
        currentUser = { uid: 'demo_' + demoUser.email, email: demoUser.email };

        if (demoUser.rol === 'alumno') {
            // Redirigir al panel del alumno directamente
            showAlumnoPanel(demoUser);
        } else {
            showDashboard();
            loadStats();
        }
        setLoginLoading(false);
        return;
    }

    // 2. Intentar Firebase Auth (staff real)
    try {
        await signInWithEmailAndPassword(auth, emailInput, password);
        // onAuthStateChanged se encargará del resto
    } catch (error) {
        console.error('Error login:', error);
        showError(getErrorMessage(error.code));
        setLoginLoading(false);
    }
});

// ══════════ MOSTRAR PANEL DE ALUMNO (desde login unificado) ══════════
function showAlumnoPanel(userData) {
    document.getElementById('loginWrapper').style.display = 'none';
    loginScreen.style.display = 'none';
    dashboard.classList.add('active');
    document.getElementById('hamburgerBtn').style.display = '';

    // Generar navegación solo para alumno
    userName.textContent = userData.nombre || userData.email;
    userRole.textContent = 'ALUMNO';
    generateNavigation();

    // Navegar automáticamente al panel del alumno
    const secAl = document.getElementById('seccionAlumno');
    if (secAl) {
        // Ocultar otras secciones
        document.querySelectorAll('#seccionClases, #seccionRecepcion').forEach(s => {
            s.classList.remove('active');
        });
        secAl.style.display = 'block';
        secAl.classList.add('active');
        // Mostrar portal si ya hay sesión de alumno, o el login del alumno
        const alScreen = document.getElementById('screen-portal');
        if (alScreen) alScreen.classList.add('visible');
        if (typeof iniciarPortal === 'function' && userData.id) {
            window.USER = { id: userData.id, nombre: userData.nombre, ...userData };
            if (typeof iniciarPortal === 'function') {
                try { iniciarPortal(); } catch(e) { console.warn('iniciarPortal:', e); }
            }
        }
    }
}

// ══════════ LOAD USER DATA ══════════
async function loadUserData(uid) {
    try {
        const userDocRef = doc(db, "usuarios", uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            showError('Usuario no autorizado. Contacta al administrador.');
            await signOut(auth);
            return;
        }

        currentUserData = userDoc.data();
        const rol = currentUserData.rol;

        // Verificar roles válidos
        if (!['admin', 'recepcion', 'maestro'].includes(rol)) {
            showError('Rol no válido. Contacta al administrador.');
            await signOut(auth);
            return;
        }

        // Mostrar dashboard
        showDashboard();
        loadStats();

    } catch (error) {
        console.error('Error cargando datos:', error);
        showError('Error al cargar información del usuario.');
        await signOut(auth);
    }
}

// ══════════ SHOW DASHBOARD ══════════
function showDashboard() {
    document.getElementById('loginWrapper').style.display = 'none';
    loginScreen.style.display = 'none';
    dashboard.classList.add('active');
    document.getElementById('hamburgerBtn').style.display = '';

    // Actualizar info del usuario
    userName.textContent = currentUserData.nombre || currentUserData.email;
    userRole.textContent = (currentUserData.rol || '').toUpperCase();

    // Mostrar sección de crear usuarios solo para admin
    if (currentUserData.rol === 'admin') {
        createUserSection.classList.remove('hidden');
    }

    // Generar navegación según rol
    generateNavigation();
}

// ══════════ GENERATE NAVIGATION (según rol) ══════════
function generateNavigation() {
    const nav = document.getElementById('sidebarNav');
    nav.innerHTML = '';

    const navItems = [];
    const rol = currentUserData ? currentUserData.rol : 'alumno';

    // Admin ve todo
    if (rol === 'admin') {
        navItems.push(
            { icon: 'fa-home', text: 'Dashboard', active: true },
            { icon: 'fa-calendar-alt', text: 'Clases', active: false },
            { icon: 'fa-desktop', text: 'Recepción', active: false },
            { icon: 'fa-users', text: 'Alumnos', active: false },
            { icon: 'fa-qrcode', text: 'Scanner', active: false }
        );
    }

    // Recepción — solo módulo de recepción
    if (rol === 'recepcion') {
        navItems.push(
            { icon: 'fa-home', text: 'Dashboard', active: true },
            { icon: 'fa-desktop', text: 'Recepción', active: false },
            { icon: 'fa-qrcode', text: 'Scanner', active: false }
        );
    }

    // Maestro
    if (rol === 'maestro') {
        navItems.push(
            { icon: 'fa-home', text: 'Dashboard', active: true },
            { icon: 'fa-qrcode', text: 'Scanner', active: false }
        );
    }

    // Alumno — solo su panel personal
    if (rol === 'alumno') {
        navItems.push(
            { icon: 'fa-user', text: 'Mi Portal', active: true }
        );
    }

    navItems.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'nav-item' + (i === 0 ? ' active' : '');
        div.innerHTML = `<i class="fas ${item.icon}"></i> ${item.text}`;
        div.onclick = () => {
            // Remover active de todos
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            div.classList.add('active');

            // Ocultar todas las secciones
            document.querySelectorAll('.stats-grid, #createUserSection, #seccionClases, #seccionRecepcion, #seccionAlumno, .form-section').forEach(s => {
                if (s.id === 'seccionClases') s.classList.remove('active');
                else if (s.id === 'seccionRecepcion') s.classList.remove('active');
                else if (s.id === 'seccionAlumno') { s.classList.remove('active'); s.style.display = 'none'; }
                else s.style.display = 'none';
            });

            // Mostrar la sección correcta
            if (item.text === 'Dashboard') {
                document.querySelector('.stats-grid').style.display = 'grid';
                if (currentUserData && currentUserData.rol === 'admin') {
                    document.getElementById('createUserSection').style.display = 'block';
                }
                const formSec = document.querySelector('.form-section');
                if (formSec) formSec.style.display = 'block';
            } else if (item.text === 'Clases') {
                document.getElementById('seccionClases').classList.add('active');
            } else if (item.text === 'Recepción') {
                const secRec = document.getElementById('seccionRecepcion');
                secRec.classList.add('active');
                if (!window._recepcionIniciada) {
                    window._recepcionIniciada = true;
                    if (typeof initRecepcion === 'function') initRecepcion();
                }
            } else if (item.text === 'Alumnos' || item.text === 'Mi Portal') {
                const secAl = document.getElementById('seccionAlumno');
                secAl.style.display = 'block';
                secAl.classList.add('active');
            }
        };
        nav.appendChild(div);
    });
}

// ══════════ LOAD STATS ══════════
async function loadStats() {
    try {
        const alumnosRef = collection(db, "alumnos");
        const snapshot = await getDocs(alumnosRef);

        let total = 0;
        let activos = 0;
        let porVencer = 0;

        const hoy = new Date();
        const en7Dias = new Date();
        en7Dias.setDate(en7Dias.getDate() + 7);

        snapshot.forEach(doc => {
            const data = doc.data();
            total++;
            if (data.estatus === 'ACTIVO') activos++;
            if (data.vencimiento) {
                const vence = new Date(data.vencimiento);
                if (vence >= hoy && vence <= en7Dias) porVencer++;
            }
        });

        document.getElementById('statTotalAlumnos').textContent = total;
        document.getElementById('statActivos').textContent = activos;
        document.getElementById('statPorVencer').textContent = porVencer;
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// ══════════ CREATE USER FORM ══════════
createUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('newUserName').value.trim();
    const email = document.getElementById('newUserEmail').value.trim();
    const password = document.getElementById('newUserPassword').value;
    const rol = document.getElementById('newUserRole').value;

    hideCreateUserMessages();
    setCreateUserLoading(true);

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;

        await setDoc(doc(db, "usuarios", newUser.uid), {
            nombre: nombre,
            email: email,
            rol: rol,
            creadoPor: currentUser.uid,
            fechaCreacion: new Date().toISOString()
        });

        createUserSuccess.classList.add('show');
        createUserForm.reset();

        setTimeout(() => createUserSuccess.classList.remove('show'), 3000);

        await signOut(auth);
    } catch (error) {
        console.error('Error creando usuario:', error);
        showCreateUserError(getErrorMessage(error.code));
    } finally {
        setCreateUserLoading(false);
    }
});

// ══════════ LOGOUT ══════════
window.logout = async function() {
    try {
        window._demoUser = null;
        await signOut(auth);
        showLogin();
    } catch (error) {
        console.error('Error logout:', error);
        showLogin();
    }
};

// ══════════ UI HELPERS ══════════
function showLogin() {
    document.getElementById('loginWrapper').style.display = 'flex';
    loginScreen.style.display = 'block';
    dashboard.classList.remove('active');
    document.getElementById('hamburgerBtn').style.display = 'none';
    document.getElementById('sidebarOverlay').classList.remove('active');
    currentUser = null;
    currentUserData = null;
    window._demoUser = null;
}

function showError(message) {
    document.getElementById('loginErrorText').textContent = message;
    loginError.classList.remove('hidden');
}

function hideError() {
    loginError.classList.add('hidden');
}

function setLoginLoading(loading) {
    btnLogin.disabled = loading;
    if (loading) {
        btnLoginText.textContent = 'Verificando...';
        btnLoginSpinner.classList.remove('hidden');
    } else {
        btnLoginText.textContent = 'INGRESAR';
        btnLoginSpinner.classList.add('hidden');
    }
}

function showCreateUserError(message) {
    createUserError.textContent = message;
    createUserError.classList.remove('hidden');
}

function hideCreateUserMessages() {
    createUserError.classList.add('hidden');
    createUserSuccess.classList.remove('show');
}

function setCreateUserLoading(loading) {
    btnCreateUser.disabled = loading;
    if (loading) {
        btnCreateUserText.textContent = 'Creando...';
        btnCreateUserSpinner.classList.remove('hidden');
    } else {
        btnCreateUserText.textContent = 'Crear Usuario';
        btnCreateUserSpinner.classList.add('hidden');
    }
}

function getErrorMessage(code) {
    const messages = {
        'auth/user-not-found': 'Usuario no encontrado.',
        'auth/wrong-password': 'Contraseña incorrecta.',
        'auth/invalid-email': 'Email inválido.',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
        'auth/email-already-in-use': 'El email ya está registrado.',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
        'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
        'auth/invalid-credential': 'Credenciales inválidas. Verifica tu email y contraseña.'
    };
    return messages[code] || 'Error de autenticación';
}
