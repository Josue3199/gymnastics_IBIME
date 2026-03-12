// =================================================================
// IBIME GYMNASTICS CLUB — Utilidades Comunes
// utils.js: toggle sidebar, toggle password, tab switching
// =================================================================

// ══════════ SIDEBAR TOGGLE (móvil) ══════════
window.toggleSidebar = function() {
    document.querySelector('.sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
};

window.closeSidebar = function() {
    document.querySelector('.sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
};

// ══════════ TOGGLE PASSWORD ══════════
window.togglePassword = function() {
    const input = document.getElementById('loginPassword');
    const icon = document.getElementById('toggleIcon');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
};

// ══════════ TAB SWITCHING ══════════
window.showLoginTab = function() {
    document.querySelectorAll('.login-tab').forEach(tab => tab.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
};

window.showRecoverTab = function() {
    document.querySelectorAll('.login-tab').forEach(tab => tab.classList.remove('active'));
    const tabs = document.querySelectorAll('.login-tab');
    if (tabs[1]) tabs[1].classList.add('active');
    alert('Funcionalidad de recuperación de contraseña próximamente.\nContacta al administrador.');
};
