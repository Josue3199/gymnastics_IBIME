// =================================================================
// IBIME GYMNASTICS CLUB — Módulo Admin / Gestión de Clases
// admin.js: horarios, costos, disciplinas, profesores
// Requiere: window.db (Firebase Firestore compat) seteado por auth.js
// =================================================================

function toastClases(m, ms = 3000) {
    document.getElementById('clasesToastMsg').innerText = m;
    const el = document.getElementById('clasesToast');
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), ms);
}

// ── DATOS BASE ──
const DIAS_CLASES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Costos mutables (se cargan desde Firebase si existen)
let COSTOS_FITNESS_CLASES = { 1: 666.67, 2: 1200, 3: 1600, 4: 1955.56, 5: 2222.22 };
let COSTOS_GIMNASIA_CLASES = { 1: 800, 2: 1440, 3: 1920, 4: 2400, 5: 2800 };
let COSTOS_FITNESS_PRONTO_CLASES = { 1: 600, 2: 1080, 3: 1440, 4: 1760, 5: 2000 };
let COSTOS_GIMNASIA_PRONTO_CLASES = { 1: 720, 2: 1296, 3: 1728, 4: 2160, 5: 2520 };

const ICONO_CLASE_MAP = {
    'yoga': '🧘', 'step': '👟', 'dance fit': '💃', 'pilates mat': '🏃', 'gap': '⚡',
    'power jump': '🦘', 'pole dance': '🎭', 'heel dance': '👠', 'sculpt': '🏋️',
    'baby gym': '👶', 'baby telas': '👶', 'gaf': '🏅', 'gr': '🎀', 'telas': '🎭',
    'parkour': '🏃', 'gav': '🤸', 'gimnasia': '🤸', 'adultos': '👩', 'default': '🏋️'
};

function getIconoClase(nombre) {
    const n = nombre.toLowerCase();
    for (const [k, v] of Object.entries(ICONO_CLASE_MAP)) {
        if (n.includes(k)) return v;
    }
    return '🏋️';
}

function getChipClassClase(nombre) {
    const n = nombre.toLowerCase();
    if (n.includes('yoga')) return 'chip-yoga';
    if (n.includes('step')) return 'chip-step';
    if (n.includes('dance fit')) return 'chip-dancefit';
    if (n.includes('pilates')) return 'chip-pilates';
    if (n.includes('gap')) return 'chip-gap';
    if (n.includes('power jump')) return 'chip-powerjump';
    if (n.includes('pole dance')) return 'chip-poledance';
    if (n.includes('heel dance')) return 'chip-heeldance';
    if (n.includes('sculpt')) return 'chip-sculpt';
    if (n.includes('baby')) return 'chip-babygym';
    if (n.includes('gaf') || n.includes('gimnasia artística')) return 'chip-gaf';
    if (n.includes('gr ') || n.includes('rítmica') || n.includes('ritmica')) return 'chip-gr';
    if (n.includes('telas') || n.includes('aro')) return 'chip-telas';
    if (n.includes('parkour')) return 'chip-parkour';
    if (n.includes('gav') || n.includes('varonil')) return 'chip-gav';
    if (n.includes('adult') || n.includes('adulto')) return 'chip-adultgym';
    return 'chip-default';
}

// ── HORARIOS BASE ──
const HORARIO_FITNESS_BASE_CLASES = [
    { hora: "07:00-08:00", dias: { Lunes: ["Yoga", "Power Jump"], Martes: ["Step", "Yoga"], Miércoles: ["Yoga", "Power Jump"], Jueves: ["Step", "Pilates Mat"], Viernes: ["Yoga", "Power Jump"] } },
    { hora: "08:00-09:00", dias: { Lunes: ["GAP", "Pilates Mat"], Martes: ["Pilates Mat", "Dance Fit"], Miércoles: ["Sculpt", "Pilates Mat"], Jueves: ["GAP", "Dance Fit"], Viernes: ["GAP", "Pilates Mat"] } },
    { hora: "09:00-10:00", dias: { Lunes: ["Dance Fit", "Pole Dance"], Martes: ["Power Jump", "Heel Dance"], Miércoles: ["Pole Dance", "Dance Fit"], Jueves: ["Power Jump", "Heel Dance"], Viernes: ["Step", "Pole Dance"], Sábado: ["Power Jump", "Step"] } },
    { hora: "10:00-11:00", dias: { Lunes: ["Step", "Heel Dance"], Martes: ["GAP", "Pole Dance"], Miércoles: ["GAP", "Heel Dance"], Jueves: ["Pole Dance", "Sculpt"], Viernes: ["Dance Fit", "Heel Dance"], Sábado: ["Dance Fit", "GAP"] } },
    { hora: "11:00-12:00", dias: { Sábado: ["Pole Dance", "Pilates Mat"] } },
    { hora: "17:00-18:00", dias: { Lunes: ["Step", "Pilates Mat"], Martes: ["Pilates Mat", "Power Jump"], Miércoles: ["Pole Dance", "Pilates Mat"], Jueves: ["Pilates Mat", "Power Jump"], Viernes: ["Step", "Pole Dance"] } },
    { hora: "18:00-19:00", dias: { Lunes: ["Dance Fit", "Power Jump"], Martes: ["Dance Fit", "GAP"], Miércoles: ["Sculpt", "Heel Dance"], Jueves: ["GAP", "Step"], Viernes: ["GAP", "Sculpt"] } },
    { hora: "19:00-20:00", dias: { Lunes: ["Sculpt", "Pole Dance"], Martes: ["Step", "Pole Dance"], Miércoles: ["Dance Fit", "Power Jump"], Jueves: ["Sculpt", "Pole Dance"], Viernes: ["Dance Fit", "Power Jump"] } },
    { hora: "20:00-21:00", dias: { Lunes: ["GAP", "Heel Dance"], Martes: ["Heel Dance", "Yoga"], Miércoles: ["GAP", "Step"], Jueves: ["Heel Dance", "Power Jump"], Viernes: ["GAP", "Yoga"] } },
];

const HORARIO_GIMNASIA_BASE_CLASES = [
    { hora: "15:00-16:00", dias: { Lunes: ["Baby Gym", "Baby Telas"], Martes: ["Baby Gym"], Miércoles: ["Baby Gym", "Baby Telas"], Jueves: ["Baby Gym"], Viernes: ["Baby Gym", "Baby Telas"] } },
    { hora: "16:00-17:00", dias: { Lunes: ["GAF PN 0 Iniciación", "GAF Nivel 1", "GAF Nivel 2", "GAF Nivel 3,4,5", "Parkour", "Telas-Aro"], Martes: ["GAF PN 0 Iniciación", "GAF Nivel 1", "GAF Nivel 2", "GAF Nivel 3,4,5", "GR S-9", "GAV", "6TR"], Miércoles: ["GAF PN 0 Iniciación", "GAF Nivel 1", "GAF Nivel 2", "GAF Nivel 3,4,5", "GR S-9", "Parkour", "Telas-Aro"], Jueves: ["GAF PN 0 Iniciación", "GAF Nivel 1", "GAF Nivel 2", "GAF Nivel 3,4,5", "GR S-9", "GAV", "6TR"], Viernes: ["GAF PN 0 Iniciación", "GAF Nivel 1", "GAF Nivel 2", "GAF Nivel 3,4,5", "Parkour", "Telas-Aro"] } },
    { hora: "17:00-18:00", dias: { Lunes: ["GAF PN 0 Iniciación", "GAF Nivel 1", "GAF Nivel 2", "GAF Nivel 3,4,5", "Parkour", "Telas-Aro"], Martes: ["GAF PN 0 Iniciación", "GAF Nivel 1", "GAF Nivel 2", "GAF Nivel 3,4,5", "GR S-9", "GAV", "6TR"], Miércoles: ["GAF PN 0 Iniciación", "GAF Nivel 1", "GAF Nivel 2", "GAF Nivel 3,4,5", "GR S-9", "GAV", "6TR"], Jueves: ["GAF PN 0 Iniciación", "GAF Nivel 1", "GAF Nivel 2", "GAF Nivel 3,4,5", "GR S-9", "GAV", "6TR"], Viernes: ["GAF PN 0 Iniciación", "GAF Nivel 1", "GAF Nivel 2", "GAF Nivel 3,4,5", "Parkour", "Telas-Aro"] } },
    { hora: "18:00-19:00", dias: { Lunes: ["GAF PN 0 Iniciación", "GAF Nivel 2", "GAF Nivel 3,4,5", "Parkour", "Telas-Aro"], Martes: ["GAF PN 0 Iniciación", "GAF Nivel 1", "GAF Nivel 2", "GAF Nivel 3,4,5", "GAV Todos", "6PT"], Miércoles: ["GAF PN 0 Iniciación", "GAF Nivel 1", "GAF Nivel 2", "GAF Nivel 3,4,5", "Telas-Aro"], Jueves: ["GAF PN 0 Iniciación", "GAF Nivel 1", "GAF Nivel 2", "GAF Nivel 3,4,5", "GAV Todos", "6PT"], Viernes: ["GAF PN 0 Iniciación", "GAF Nivel 2", "GAF Nivel 3,4,5", "Parkour", "Telas-Aro"] } },
    { hora: "19:00-20:00", dias: { Lunes: ["GAF PN 0 Iniciación", "GAF Nivel 1", "GAF Nivel 2", "GAF Nivel 3,4,5", "Gimnasia para Adultos"], Martes: ["GAF PN 0 Iniciación", "GAF Nivel 1", "GAF Nivel 2", "GAF Nivel 3,4,5", "Gimnasia Adultos"], Miércoles: ["GAF PN 0 Iniciación", "GAF Nivel 1", "GAF Nivel 2", "GAF Nivel 3,4,5", "Gimnasia para Adultos"], Jueves: ["GAF PN 0 Iniciación", "GAF Nivel 1", "GAF Nivel 2", "GAF Nivel 3,4,5", "Gimnasia Adultos"] } },
    { hora: "09:00-10:00", dias: { Sábado: ["GAF PN 0 Iniciación", "GAF Nivel 1", "GAF Nivel 2", "GAF Nivel 3,4,5", "Parkour", "Telas-Aro", "GR"] } },
    { hora: "10:00-11:00", dias: { Sábado: ["GAF PN 0 Iniciación", "GAF Nivel 1", "GAF Nivel 2", "GAF Nivel 3,4,5", "Parkour", "Telas-Aro", "GR"] } },
    { hora: "11:00-12:00", dias: { Sábado: ["GAF PN 0 Iniciación", "GAF Nivel 1", "GAF Nivel 2", "GAF Nivel 3,4,5", "Parkour", "Telas-Aro", "7TR"] } },
    { hora: "12:00-13:00", dias: { Sábado: ["GAF PN 0 Iniciación", "GAF Nivel 1", "GAF Nivel 3,4,5", "Telas-Aro", "GR", "6TR"] } },
];

// Clones editables
let HORARIO_FITNESS_CLASES = JSON.parse(JSON.stringify(HORARIO_FITNESS_BASE_CLASES));
let HORARIO_GIMNASIA_CLASES = JSON.parse(JSON.stringify(HORARIO_GIMNASIA_BASE_CLASES));

// Cupos por celda
const cuposLocalesClases = {};
function getCupoClase(hora, dia) { return cuposLocalesClases[hora + '|' + dia] || 20; }
function setCupoClase(hora, dia, val) { cuposLocalesClases[hora + '|' + dia] = val; }

// Profesores locales
const profesoresLocalClases = {};
function fbKeyClase(nombre, hora, dia) { return nombre + '|' + hora + '|' + dia; }
function getProfClase(nombre, hora, dia) {
    const k = fbKeyClase(nombre, hora, dia);
    if (fbDocsMapClases.has(k)) return fbDocsMapClases.get(k).profesor || '';
    return profesoresLocalClases[k] || '';
}

// Firebase docs map
let fbDocsMapClases = new Map();
let clasesEnFirebaseClases = new Set();
let firebaseInitedClases = false;

// Celda activa
let celdaActivaClases = null;

// ── CARGAR COSTOS ──
async function cargarCostosClases() {
    const db = window.db;
    try {
        const df = await db.collection('config').doc('costos_fitness').get();
        if (df.exists) {
            const d = df.data();
            COSTOS_FITNESS_CLASES = { 1: d.d1, 2: d.d2, 3: d.d3, 4: d.d4, 5: d.d5 };
            COSTOS_FITNESS_PRONTO_CLASES = { 1: d.p1, 2: d.p2, 3: d.p3, 4: d.p4, 5: d.p5 };
            actualizarInputsCostosClases('fitness');
        }
    } catch (e) { console.warn('No se pudieron cargar costos fitness', e); }
    try {
        const dg = await db.collection('config').doc('costos_gimnasia').get();
        if (dg.exists) {
            const d = dg.data();
            COSTOS_GIMNASIA_CLASES = { 1: d.d1, 2: d.d2, 3: d.d3, 4: d.d4, 5: d.d5 };
            COSTOS_GIMNASIA_PRONTO_CLASES = { 1: d.p1, 2: d.p2, 3: d.p3, 4: d.p4, 5: d.p5 };
            actualizarInputsCostosClases('gimnasia');
        }
    } catch (e) { console.warn('No se pudieron cargar costos gimnasia', e); }
}

function actualizarInputsCostosClases(area) {
    const costos = area === 'fitness' ? COSTOS_FITNESS_CLASES : COSTOS_GIMNASIA_CLASES;
    const pronto = area === 'fitness' ? COSTOS_FITNESS_PRONTO_CLASES : COSTOS_GIMNASIA_PRONTO_CLASES;
    const p = area === 'fitness' ? 'f' : 'g';
    [1, 2, 3, 4, 5].forEach(n => {
        const r = document.getElementById('c' + p + 'r' + n);
        const pp = document.getElementById('c' + p + 'p' + n);
        if (r) r.value = costos[n];
        if (pp) pp.value = pronto[n];
    });
}

function leerInputsCostosClases(area) {
    const db = window.db;
    const p = area === 'fitness' ? 'f' : 'g';
    const reg = {}, pronto = {};
    [1, 2, 3, 4, 5].forEach(n => {
        reg[n] = parseFloat(document.getElementById('c' + p + 'r' + n)?.value || 0);
        pronto[n] = parseFloat(document.getElementById('c' + p + 'p' + n)?.value || 0);
    });
    return { regular: reg, pronto };
}

window.guardarCostosClases = async function(area) {
    const { regular, pronto } = leerInputsCostosClases(area);
    const data = {
        d1: regular[1], d2: regular[2], d3: regular[3], d4: regular[4], d5: regular[5],
        p1: pronto[1], p2: pronto[2], p3: pronto[3], p4: pronto[4], p5: pronto[5],
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    try {
        await db.collection('config').doc('costos_' + area).set(data);
        if (area === 'fitness') {
            COSTOS_FITNESS_CLASES = regular;
            COSTOS_FITNESS_PRONTO_CLASES = pronto;
        } else {
            COSTOS_GIMNASIA_CLASES = regular;
            COSTOS_GIMNASIA_PRONTO_CLASES = pronto;
        }
        toastClases('✅ Costos ' + area + ' guardados en Firebase');
    } catch (e) { toastClases('❌ ' + e.message); }
};

// ── INIT HORARIOS FROM FIREBASE ──
function initHorariosFromFirebaseClases() {
    const fitDocs = [...fbDocsMapClases.values()].filter(d => d.area === 'fitness');
    const gymDocs = [...fbDocsMapClases.values()].filter(d => d.area === 'gimnasia');
    if (fitDocs.length > 0) HORARIO_FITNESS_CLASES = buildHorarioFromDocsClases(fitDocs);
    if (gymDocs.length > 0) HORARIO_GIMNASIA_CLASES = buildHorarioFromDocsClases(gymDocs);
    fbDocsMapClases.forEach((d, k) => {
        if (d.cupo) setCupoClase(d.inicio + '-' + d.fin, d.dia, d.cupo);
    });
}

function buildHorarioFromDocsClases(docs) {
    const map = {};
    for (const d of docs) {
        const hora = d.inicio + '-' + d.fin;
        if (!map[hora]) map[hora] = { hora, dias: {} };
        if (!map[hora].dias[d.dia]) map[hora].dias[d.dia] = [];
        if (!map[hora].dias[d.dia].includes(d.nombre)) map[hora].dias[d.dia].push(d.nombre);
    }
    return Object.values(map).sort((a, b) => a.hora.localeCompare(b.hora));
}

// ── RENDER GRID ──
function renderGridClases(horario, contenedorId, area) {
    const cont = document.getElementById(contenedorId);
    if (!cont) return;

    // Cabecera: hora + días
    let html = '<div class="clases-gh-head" style="border-right:1px solid rgba(255,255,255,.04)"></div>';
    DIAS_CLASES.forEach(d => html += `<div class="clases-gh-head">${d}</div>`);

    horario.forEach((franja, fi) => {
        // Hora en dos líneas: "07:00-" / "08:00"
        const [hIni, hFin] = franja.hora.split('-');
        html += `<div class="clases-gh-hora">${hIni}–<br>${hFin}</div>`;

        DIAS_CLASES.forEach(dia => {
            const clases = franja.dias[dia] || [];
            const enFB = clases.some(c => clasesEnFirebaseClases.has(fbKeyClase(c, franja.hora, dia)));
            const isActiva = celdaActivaClases &&
                celdaActivaClases.hora === franja.hora &&
                celdaActivaClases.dia === dia &&
                celdaActivaClases.area === area;

            const chipsHTML = clases.length === 0
                ? `<div class="clases-chip-add" onclick="abrirCeldaClase('${franja.hora}','${dia}','${area}',${fi})">+ agregar</div>`
                : clases.map(c => {
                    const prof = getProfClase(c, franja.hora, dia);
                    return `<div class="clases-clase-chip ${getChipClassClase(c)}">
                        ${getIconoClase(c)} ${c}
                        ${prof ? `<span class="clases-chip-prof">👤 ${prof}</span>` : ''}
                    </div>`;
                }).join('');

            html += `<div class="clases-gh-cell ${enFB ? 'clases-celda-fb' : ''}">
                <div class="clases-celda ${isActiva ? (area === 'fitness' ? 'editando-fit' : 'editando') : ''}"
                     onclick="abrirCeldaClase('${franja.hora}','${dia}','${area}',${fi})"
                     title="${franja.hora} · ${dia}">
                  ${chipsHTML}
                </div>
              </div>`;
        });
    });
    cont.innerHTML = html;
}

// ── ABRIR CELDA ──
window.abrirCeldaClase = function(hora, dia, area, franjaIdx) {
    celdaActivaClases = { hora, dia, area, franjaIdx };
    renderGridClases(area === 'fitness' ? HORARIO_FITNESS_CLASES : HORARIO_GIMNASIA_CLASES,
        area === 'fitness' ? 'gridClasesFitness' : 'gridClasesGimnasia', area);
    renderEditPanelClases(hora, dia, area, franjaIdx);
};

function renderEditPanelClases(hora, dia, area, franjaIdx) {
    const horario = area === 'fitness' ? HORARIO_FITNESS_CLASES : HORARIO_GIMNASIA_CLASES;
    const franja = horario[franjaIdx];
    if (!franja) { console.warn('Franja not found'); cerrarCeldaClase(); return; }
    if (!franja.dias[dia]) franja.dias[dia] = [];
    const clases = franja.dias[dia];
    const color = area === 'fitness' ? 'var(--clases-fitness)' : 'var(--clases-gimnasia)';
    const panelId = 'editPanelClases' + (area === 'fitness' ? 'Fitness' : 'Gimnasia');
    const panel = document.getElementById(panelId);
    if (!panel) return;
    panel.classList.remove('hidden');

    const todas = area === 'fitness'
        ? ['Yoga', 'Power Jump', 'Step', 'Pilates Mat', 'Dance Fit', 'GAP', 'Sculpt', 'Pole Dance', 'Heel Dance']
        : ['GAF PN 0 Iniciación', 'GAF Nivel 1', 'GAF Nivel 2', 'GAF Nivel 3,4,5', 'GR S-9', 'GR', 'GAV', 'GAV Todos', 'Parkour', 'Telas-Aro', 'Baby Gym', 'Baby Telas', 'Gimnasia para Adultos', '6TR', '6PT', '7TR'];
    const sugeridas = todas.filter(s => !clases.includes(s));
    const cupo = getCupoClase(hora, dia);

    let chipsHTML = '';
    if (clases.length === 0) {
        chipsHTML = '<p style="font-size:.65rem;color:var(--clases-muted);padding:.4rem">Sin disciplinas — agrega abajo</p>';
    } else {
        chipsHTML = clases.map((c, i) => {
            const prof = getProfClase(c, hora, dia);
            const k = fbKeyClase(c, hora, dia);
            const enFB = clasesEnFirebaseClases.has(k);
            const sn = c.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            const kSafe = k.replace(/"/g, '&quot;');
            const profSafe = (prof || '').replace(/"/g, '&quot;');
            return `<div style="background:rgba(255,255,255,.03);border:1px solid var(--clases-border);border-radius:7px;padding:.4rem .5rem;margin-bottom:.35rem">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:.3rem">
                  <div class="clases-edit-chip ${getChipClassClase(c)}" style="cursor:default;flex:1;min-width:0;overflow:hidden">
                    ${getIconoClase(c)} ${c}${enFB ? '<span style="color:var(--clases-accent2);font-size:.5rem;margin-left:3px">✓</span>' : ''}
                  </div>
                  <div style="display:flex;gap:3px;flex-shrink:0">
                    <button onclick="quitarClaseClase('${hora}','${dia}','${area}',${franjaIdx},${i})" style="background:rgba(239,68,68,.1);color:var(--clases-danger);border:1px solid rgba(239,68,68,.2);border-radius:4px;padding:2px 5px;font-size:.55rem;font-weight:700;cursor:pointer" title="Quitar">✕</button>
                  </div>
                </div>
                <div style="margin-top:.28rem">
                  <input type="text" class="clases-prof-input"
                    data-clave="${kSafe}" data-enfb="${enFB ? '1' : '0'}"
                    value="${profSafe}"
                    placeholder="👤 Nombre del profesor..."
                    onblur="onProfBlurClase(this)">
                </div>
              </div>`;
        }).join('');
    }

    document.getElementById(panelId).innerHTML = `
        <div style="margin-bottom:.7rem">
          <p style="font-size:.58rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${color};margin-bottom:.3rem">${dia} · ${hora}</p>
          <p style="font-size:.62rem;color:var(--clases-muted);font-weight:600">${clases.length} disciplina${clases.length !== 1 ? 's' : ''}</p>
        </div>

        <div style="margin-bottom:.6rem">
          <p style="font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--clases-muted);margin-bottom:.4rem">Disciplinas</p>
          <div id="chipsActualesClases_${area}">${chipsHTML}</div>
        </div>

        <div style="margin-bottom:.5rem">
          <p style="font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--clases-muted);margin-bottom:.4rem">Agregar disciplina</p>
          <div class="clases-add-row">
            <input type="text" id="inputNuevaClase_${area}" placeholder="Nombre de la clase..." onkeydown="if(event.key==='Enter')agregarClaseClase('${hora}','${dia}','${area}',${franjaIdx})">
            <button onclick="agregarClaseClase('${hora}','${dia}','${area}',${franjaIdx})" style="background:${color};color:white">+ Agregar</button>
          </div>
        </div>

        ${sugeridas.length ? `
        <div style="margin-bottom:.8rem">
          <p style="font-size:.58rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--clases-muted);margin-bottom:.35rem">Sugerencias rápidas</p>
          <div class="clases-sugerencias">
            ${sugeridas.map(s => `<button class="clases-sug-chip" onclick="agregarSugeridaClase('${hora}','${dia}','${area}',${franjaIdx},'${s.replace(/'/g, "\\'")}')">+ ${s}</button>`).join('')}
          </div>
        </div>` : ''}

        <div class="clases-cupo-row">
          <label>Cupo por clase</label>
          <div class="clases-cupo-ctrl">
            <button onclick="cambiarCupoClase('${hora}','${dia}',-5)">−</button>
            <span id="cupoValClase_${hora}_${dia}">${cupo}</span>
            <button onclick="cambiarCupoClase('${hora}','${dia}',5)">+</button>
          </div>
        </div>

        <button class="clases-pub-celda-btn" style="background:${color};color:white;margin-bottom:.4rem"
          onclick="publicarCeldaClase('${hora}','${dia}','${area}',${franjaIdx})">
          <i class="fa-solid fa-cloud-arrow-up"></i> Publicar / Actualizar celda
        </button>
        <button class="clases-pub-celda-btn clases-btn-ghost" onclick="cerrarCeldaClase()">
          <i class="fa-solid fa-xmark"></i> Cerrar
        </button>
      `;
}

// ── PROFESOR ONBLUR ──
window.onProfBlurClase = function(el) {
    const k = el.dataset.clave;
    const val = el.value;
    profesoresLocalClases[k] = val;
    if (el.dataset.enfb === '1') {
        actualizarProfesorFirebaseClase(k, val);
    }
};

async function actualizarProfesorFirebaseClase(key, profesor) {
    const db = window.db;
    if (!fbDocsMapClases.has(key)) return;
    const docData = fbDocsMapClases.get(key);
    try {
        await db.collection('catalogo').doc(docData.id).update({ profesor });
    } catch (e) { console.warn('Error actualizando profesor:', e); }
}

function cerrarCeldaClase() {
    const db = window.db;
    celdaActivaClases = null;
    renderGridClases(HORARIO_FITNESS_CLASES, 'gridClasesFitness', 'fitness');
    renderGridClases(HORARIO_GIMNASIA_CLASES, 'gridClasesGimnasia', 'gimnasia');
    const pf = document.getElementById('editPanelClasesFitness');
    const pg = document.getElementById('editPanelClasesGimnasia');
    if (pf) { pf.classList.add('hidden'); pf.innerHTML = ''; }
    if (pg) { pg.classList.add('hidden'); pg.innerHTML = ''; }
}

// ── EDICIÓN ──
window.agregarClaseClase = function(hora, dia, area, fi) {
    const id = 'inputNuevaClase_' + area;
    const val = document.getElementById(id)?.value.trim();
    if (!val) { toastClases('⚠️ Escribe el nombre de la clase'); return; }
    const horario = area === 'fitness' ? HORARIO_FITNESS_CLASES : HORARIO_GIMNASIA_CLASES;
    if (!horario[fi].dias[dia]) horario[fi].dias[dia] = [];
    if (horario[fi].dias[dia].includes(val)) { toastClases('Ya existe en esta celda'); return; }
    horario[fi].dias[dia].push(val);
    document.getElementById(id).value = '';
    renderGridClases(area === 'fitness' ? HORARIO_FITNESS_CLASES : HORARIO_GIMNASIA_CLASES,
        area === 'fitness' ? 'gridClasesFitness' : 'gridClasesGimnasia', area);
    renderEditPanelClases(hora, dia, area, fi);
    toastClases('✅ ' + val + ' agregada');
};

window.agregarSugeridaClase = function(hora, dia, area, fi, nombre) {
    const horario = area === 'fitness' ? HORARIO_FITNESS_CLASES : HORARIO_GIMNASIA_CLASES;
    if (!horario[fi].dias[dia]) horario[fi].dias[dia] = [];
    if (horario[fi].dias[dia].includes(nombre)) { toastClases('Ya existe'); return; }
    horario[fi].dias[dia].push(nombre);
    renderGridClases(area === 'fitness' ? HORARIO_FITNESS_CLASES : HORARIO_GIMNASIA_CLASES,
        area === 'fitness' ? 'gridClasesFitness' : 'gridClasesGimnasia', area);
    renderEditPanelClases(hora, dia, area, fi);
};

window.quitarClaseClase = function(hora, dia, area, fi, idx) {
    const horario = area === 'fitness' ? HORARIO_FITNESS_CLASES : HORARIO_GIMNASIA_CLASES;
    const nombre = horario[fi].dias[dia][idx];
    horario[fi].dias[dia].splice(idx, 1);
    renderGridClases(area === 'fitness' ? HORARIO_FITNESS_CLASES : HORARIO_GIMNASIA_CLASES,
        area === 'fitness' ? 'gridClasesFitness' : 'gridClasesGimnasia', area);
    renderEditPanelClases(hora, dia, area, fi);
    toastClases('🗑️ ' + nombre + ' quitada');
};

window.cambiarCupoClase = function(hora, dia, delta) {
    const cur = getCupoClase(hora, dia);
    const nuevo = Math.max(5, Math.min(50, cur + delta));
    setCupoClase(hora, dia, nuevo);
    const el = document.getElementById('cupoValClase_' + hora + '_' + dia);
    if (el) el.textContent = nuevo;
    if (celdaActivaClases && celdaActivaClases.hora === hora && celdaActivaClases.dia === dia) {
        const horario = celdaActivaClases.area === 'fitness' ? HORARIO_FITNESS_CLASES : HORARIO_GIMNASIA_CLASES;
        const franja = horario[celdaActivaClases.franjaIdx];
        const clases = (franja && franja.dias[dia]) || [];
        clases.forEach(nombre => {
            const k = fbKeyClase(nombre, hora, dia);
            if (fbDocsMapClases.has(k)) {
                db.collection('catalogo').doc(fbDocsMapClases.get(k).id).update({ cupo: nuevo, cupoDisponible: nuevo }).catch((e) => { console.error('Error actualizando cupo:', e); });
            }
        });
    }
};

// ── PUBLICAR CELDA ──
window.publicarCeldaClase = async function(hora, dia, area, fi) {
    const horario = area === 'fitness' ? HORARIO_FITNESS_CLASES : HORARIO_GIMNASIA_CLASES;
    const clases = horario[fi].dias[dia] || [];
    if (!clases.length) { toastClases('⚠️ No hay disciplinas en esta celda'); return; }
    const [inicio, fin] = hora.split('-');
    const cupo = getCupoClase(hora, dia);
    const costos = area === 'fitness' ? COSTOS_FITNESS_CLASES : COSTOS_GIMNASIA_CLASES;
    const pronto = area === 'fitness' ? COSTOS_FITNESS_PRONTO_CLASES : COSTOS_GIMNASIA_PRONTO_CLASES;
    let ok = 0, upd = 0;
    for (const nombre of clases) {
        const k = fbKeyClase(nombre, hora, dia);
        const profesor = profesoresLocalClases[k] || fbDocsMapClases.get(k)?.profesor || '';
        const payload = {
            nombre, tipo: 'clase', area, inicio, fin, dia,
            diasSemana: [dia], cupo, cupoDisponible: cupo,
            precio: costos[1], precioPronto: pronto[1],
            icon: getIconoClase(nombre), profesor, activa: true,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        try {
            if (clasesEnFirebaseClases.has(k)) {
                await db.collection('catalogo').doc(fbDocsMapClases.get(k).id).update(payload);
                upd++;
            } else {
                await db.collection('catalogo').add(payload);
                ok++;
            }
        } catch (e) { toastClases('❌ ' + nombre + ': ' + e.message); }
    }
    const msg = [];
    if (ok) msg.push('✅ ' + ok + ' publicada' + (ok !== 1 ? 's' : ''));
    if (upd) msg.push('🔄 ' + upd + ' actualizada' + (upd !== 1 ? 's' : ''));
    toastClases(msg.join(' · ') + ' — ' + dia + ' ' + hora);
};

// ── PUBLICAR ÁREA ──
window.publicarAreaClases = async function(area) {
    const horario = area === 'fitness' ? HORARIO_FITNESS_CLASES : HORARIO_GIMNASIA_CLASES;
    const costos = area === 'fitness' ? COSTOS_FITNESS_CLASES : COSTOS_GIMNASIA_CLASES;
    const pronto = area === 'fitness' ? COSTOS_FITNESS_PRONTO_CLASES : COSTOS_GIMNASIA_PRONTO_CLASES;
    let ok = 0, upd = 0;
    for (const franja of horario) {
        const [inicio, fin] = franja.hora.split('-');
        for (const [dia, clases] of Object.entries(franja.dias)) {
            const cupo = getCupoClase(franja.hora, dia);
            for (const nombre of clases) {
                const k = fbKeyClase(nombre, franja.hora, dia);
                const profesor = profesoresLocalClases[k] || fbDocsMapClases.get(k)?.profesor || '';
                const payload = {
                    nombre, tipo: 'clase', area, inicio, fin, dia,
                    diasSemana: [dia], cupo, cupoDisponible: cupo,
                    precio: costos[1], precioPronto: pronto[1],
                    icon: getIconoClase(nombre), profesor, activa: true,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                };
                try {
                    if (clasesEnFirebaseClases.has(k)) {
                        await db.collection('catalogo').doc(fbDocsMapClases.get(k).id).update(payload);
                        upd++;
                    } else {
                        await db.collection('catalogo').add(payload);
                        ok++;
                    }
                } catch (e) { }
            }
        }
    }
    toastClases('✅ ' + ok + ' publicadas · 🔄 ' + upd + ' actualizadas', 5000);
};

// ── GENERAR CLASES PLANAS ──
function generarClasesPlanasClases(horario, area) {
    const mapa = {};
    for (const franja of horario) {
        const [ini, fin] = franja.hora.split('-');
        for (const [dia, clases] of Object.entries(franja.dias)) {
            for (const nombre of clases) {
                const key = nombre + '|' + franja.hora + '|' + dia;
                if (!mapa[key]) mapa[key] = { nombre, inicio: ini, fin, area, dia, dias: [dia], icono: getIconoClase(nombre), hora: franja.hora };
            }
        }
    }
    return Object.values(mapa);
}

let clasesPlanasClases = [];
function recalcPlanasClases() {
    clasesPlanasClases = [
        ...generarClasesPlanasClases(HORARIO_FITNESS_CLASES, 'fitness'),
        ...generarClasesPlanasClases(HORARIO_GIMNASIA_CLASES, 'gimnasia')
    ];
    document.getElementById('totalClasesCountClases').innerText = clasesPlanasClases.length;
    document.getElementById('hPendientes').innerText = clasesPlanasClases.filter(c => !clasesEnFirebaseClases.has(fbKeyClase(c.nombre, c.hora, c.dia))).length;
}

function renderPubGridClases() {
    const db = window.db;
    recalcPlanasClases();
    const cupo = parseInt(document.getElementById('cupoPredeterminadoClases')?.value || 20);
    const grid = document.getElementById('pubGridClases');
    if (!grid) return;
    grid.innerHTML = clasesPlanasClases.map((c, i) => {
        const k = fbKeyClase(c.nombre, c.hora, c.dia);
        const enFB = clasesEnFirebaseClases.has(k);
        const area = c.area;
        const prof = enFB ? (fbDocsMapClases.get(k)?.profesor || '') : (profesoresLocalClases[k] || '');
        return `<div class="clases-pub-card ${enFB ? 'en-fb' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:.5rem">
            <div>
              <div style="font-weight:700;font-size:.78rem;text-transform:uppercase;letter-spacing:.03em">${getIconoClase(c.nombre)} ${c.nombre}</div>
              <div style="font-size:.58rem;font-weight:700;padding:2px 6px;border-radius:4px;margin-top:3px;display:inline-block;background:${area === 'fitness' ? 'rgba(249,115,22,.15)' : 'rgba(99,102,241,.15)'};color:${area === 'fitness' ? 'var(--clases-fitness)' : 'var(--clases-gimnasia)'}">${area}</div>
              ${prof ? `<div style="font-size:.55rem;color:var(--clases-muted);margin-top:3px">👤 ${prof}</div>` : ''}
            </div>
            ${enFB ? '<span style="color:var(--clases-accent2);font-size:.62rem;font-weight:700">✅ En Firebase</span>' : ''}
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:.6rem"><span style="font-size:.57rem;font-weight:700;padding:1px 6px;border-radius:4px;background:rgba(255,255,255,.06);color:var(--clases-muted)">${c.dia}</span></div>
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:.68rem;margin:.5rem 0 .7rem">
            <div><div style="font-size:.58rem;color:var(--clases-muted);font-weight:700">Horario</div><div style="font-weight:700;font-size:.72rem">${c.inicio} – ${c.fin}</div></div>
            <div>
              <div style="font-family:'Bebas Neue','Outfit',sans-serif;font-size:1.05rem;color:var(--clases-accent2)">$${(area === 'fitness' ? COSTOS_FITNESS_CLASES[1] : COSTOS_GIMNASIA_CLASES[1]).toLocaleString('es-MX')}</div>
              <div style="font-size:.57rem;color:var(--clases-accent2);font-weight:700">Pronto: $${(area === 'fitness' ? COSTOS_FITNESS_PRONTO_CLASES[1] : COSTOS_GIMNASIA_PRONTO_CLASES[1]).toLocaleString('es-MX')}</div>
            </div>
          </div>
          <button class="clases-pub-celda-btn ${enFB ? 'publicada' : 'publicar'}" ${enFB ? 'disabled' : ''} onclick="publicarUnaClase(${i})" style="${enFB ? 'background:rgba(200,56,42,.12);color:var(--clases-accent2);border:1px solid var(--clases-accent2);cursor:default' : 'background:var(--clases-accent);color:white'}">
            ${enFB ? '✅ Ya publicada' : '🚀 Publicar'}
          </button>
        </div>`;
    }).join('');
}

window.publicarUnaClase = async function(i) {
    const c = clasesPlanasClases[i];
    const cupo = 20;
    const costos = c.area === 'fitness' ? COSTOS_FITNESS_CLASES : COSTOS_GIMNASIA_CLASES;
    const pronto = c.area === 'fitness' ? COSTOS_FITNESS_PRONTO_CLASES : COSTOS_GIMNASIA_PRONTO_CLASES;
    const k = fbKeyClase(c.nombre, c.hora, c.dia);
    const profesor = profesoresLocalClases[k] || fbDocsMapClases.get(k)?.profesor || '';
    const payload = {
        nombre: c.nombre, tipo: 'clase', area: c.area, inicio: c.inicio, fin: c.fin,
        dia: c.dia, diasSemana: [c.dia], cupo, cupoDisponible: cupo,
        precio: costos[1], precioPronto: pronto[1],
        icon: c.icono, profesor, activa: true,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    try {
        if (clasesEnFirebaseClases.has(k)) {
            await db.collection('catalogo').doc(fbDocsMapClases.get(k).id).update(payload);
            toastClases('🔄 ' + c.nombre + ' — ' + c.dia + ' actualizada');
        } else {
            await db.collection('catalogo').add(payload);
            toastClases('✅ ' + c.nombre + ' — ' + c.dia + ' publicada');
        }
    } catch (e) { toastClases('❌ ' + e.message); }
};

window.publicarTodoClases = async function() {
    const cupo = parseInt(document.getElementById('cupoPredeterminadoClases').value || 20);
    let ok = 0, upd = 0, err = 0;
    for (let i = 0; i < clasesPlanasClases.length; i++) {
        const c = clasesPlanasClases[i];
        const k = fbKeyClase(c.nombre, c.hora, c.dia);
        const costos = c.area === 'fitness' ? COSTOS_FITNESS_CLASES : COSTOS_GIMNASIA_CLASES;
        const pronto = c.area === 'fitness' ? COSTOS_FITNESS_PRONTO_CLASES : COSTOS_GIMNASIA_PRONTO_CLASES;
        const profesor = profesoresLocalClases[k] || fbDocsMapClases.get(k)?.profesor || '';
        const payload = {
            nombre: c.nombre, tipo: 'clase', area: c.area, inicio: c.inicio, fin: c.fin,
            dia: c.dia, diasSemana: [c.dia], cupo, cupoDisponible: cupo,
            precio: costos[1], precioPronto: pronto[1],
            icon: c.icono, profesor, activa: true,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        try {
            if (clasesEnFirebaseClases.has(k)) {
                await db.collection('catalogo').doc(fbDocsMapClases.get(k).id).update(payload);
                upd++;
            } else {
                await db.collection('catalogo').add(payload);
                ok++;
            }
        } catch (e) { err++; }
    }
    toastClases('🎉 ' + ok + ' nuevas · 🔄 ' + upd + ' actualizadas · ❌ ' + err + ' errores', 5000);
};

// ── CARGA MASIVA ──
window.importarTodasClases = async function() {
    recalcPlanasClases();
    const cupo = 20;
    document.getElementById('importProgressClases').style.display = 'block';
    const log = document.getElementById('importLogClases');
    let ok = 0, err = 0, pen = clasesPlanasClases.length;
    document.getElementById('logPenClases').innerText = pen;
    log.innerHTML = '';
    for (const c of clasesPlanasClases) {
        const costos = c.area === 'fitness' ? COSTOS_FITNESS_CLASES : COSTOS_GIMNASIA_CLASES;
        const pronto = c.area === 'fitness' ? COSTOS_FITNESS_PRONTO_CLASES : COSTOS_GIMNASIA_PRONTO_CLASES;
        const k = fbKeyClase(c.nombre, c.hora, c.dia);
        const profesor = profesoresLocalClases[k] || '';
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:.45rem 0;border-bottom:1px solid var(--clases-border);font-size:.68rem';
        row.innerHTML = `<span>${getIconoClase(c.nombre)} ${c.nombre} · ${c.dia} ${c.inicio}-${c.fin}</span><span style="color:var(--clases-muted)">⏳</span>`;
        log.appendChild(row);
        try {
            await db.collection('catalogo').add({
                nombre: c.nombre, tipo: 'clase', area: c.area, inicio: c.inicio, fin: c.fin,
                dia: c.dia, diasSemana: [c.dia], cupo, cupoDisponible: cupo,
                precio: costos[1], precioPronto: pronto[1],
                icon: c.icono, profesor, activa: true,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            row.querySelector('span:last-child').innerHTML = '<span style="color:var(--clases-accent2)">✅</span>'; ok++;
        } catch (e) {
            row.querySelector('span:last-child').innerHTML = '<span style="color:var(--clases-danger)">❌</span>'; err++;
        }
        pen--;
        document.getElementById('logOkClases').innerText = ok;
        document.getElementById('logErrClases').innerText = err;
        document.getElementById('logPenClases').innerText = pen;
        log.scrollTop = log.scrollHeight;
    }
    toastClases('🎉 Importación completa: ' + ok + ' clases', 6000);
};

window.limpiarFirebaseClases = async function() {
    if (!confirm('⚠️ ¿Eliminar TODAS las clases del catálogo? Esta acción no se puede deshacer.')) return;
    const snap = await db.collection('catalogo').where('tipo', '==', 'clase').get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    HORARIO_FITNESS_CLASES = JSON.parse(JSON.stringify(HORARIO_FITNESS_BASE_CLASES));
    HORARIO_GIMNASIA_CLASES = JSON.parse(JSON.stringify(HORARIO_GIMNASIA_BASE_CLASES));
    firebaseInitedClases = false;
    toastClases('🗑️ ' + snap.size + ' clases eliminadas');
};

// ── NAV TABS ──
window.switchTabClases = function(id, btn) {
    document.querySelectorAll('#seccionClases .clases-view').forEach(v => v.classList.remove('active'));
    document.getElementById('viewClases' + id.charAt(0).toUpperCase() + id.slice(1)).classList.add('active');
    document.querySelectorAll('#seccionClases .clases-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (id === 'publicar') renderPubGridClases();
    if (id === 'alumno') renderVistaAlumnoClases();
};

// ── VISTA ALUMNO ──
let _vaAreaClases = 'fitness';

window.renderVistaAlumnoClases = function(area) {
    _vaAreaClases = area || _vaAreaClases;
    document.getElementById('btnVaFitClases').style.opacity = _vaAreaClases === 'fitness' ? '1' : '.5';
    document.getElementById('btnVaGymClases').style.opacity = _vaAreaClases === 'gimnasia' ? '1' : '.5';

    const horario = _vaAreaClases === 'fitness' ? HORARIO_FITNESS_CLASES : HORARIO_GIMNASIA_CLASES;
    const color = _vaAreaClases === 'fitness' ? 'var(--clases-fitness)' : 'var(--clases-gimnasia)';

    const disciplinas = {};
    for (const franja of horario) {
        const [ini, fin] = franja.hora.split('-');
        for (const [dia, clases] of Object.entries(franja.dias)) {
            for (const nombre of clases) {
                if (!disciplinas[nombre]) disciplinas[nombre] = { porDia: {}, profesores: new Set() };
                if (!disciplinas[nombre].porDia[dia]) disciplinas[nombre].porDia[dia] = [];
                disciplinas[nombre].porDia[dia].push({ hora: franja.hora, inicio: ini, fin });
                const prof = getProfClase(nombre, franja.hora, dia);
                if (prof) disciplinas[nombre].profesores.add(prof);
            }
        }
    }

    const ORDEN_DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    const html = Object.entries(disciplinas).sort((a, b) => a[0].localeCompare(b[0])).map(([nombre, info]) => {
        const cc = getChipClassClase(nombre);
        const icono = getIconoClase(nombre);
        const porDia = info.porDia;
        const totalSlots = Object.values(porDia).reduce((s, h) => s + h.length, 0);
        const diasCount = Object.keys(porDia).length;
        const profesores = [...info.profesores].join(', ');

        const diasHtml = ORDEN_DIAS.filter(d => porDia[d]).map(dia => {
            const horas = porDia[dia];
            return `
            <div style="margin-bottom:.5rem">
              <p style="font-size:.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:${color};margin-bottom:.25rem">${dia}</p>
              <div style="display:flex;flex-wrap:wrap;gap:3px">
                ${horas.map(h => `<span style="font-size:.62rem;font-weight:700;padding:2px 8px;border-radius:5px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:var(--clases-txt)">${h.inicio}–${h.fin}</span>`).join('')}
              </div>
            </div>`;
        }).join('');

        return `<div style="background:var(--clases-surface);border:1.5px solid var(--clases-border);border-radius:14px;padding:1.1rem;transition:all .2s" onmouseover="this.style.borderColor='${color}'" onmouseout="this.style.borderColor='var(--clases-border)'">
          <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.9rem">
            <div class="clases-clase-chip ${cc}" style="padding:4px 10px;font-size:.65rem">${icono} ${nombre}</div>
            <div style="margin-left:auto;text-align:right">
              <p style="font-size:.8rem;font-weight:900;font-family:'Bebas Neue','Outfit',sans-serif;letter-spacing:1px;color:${color}">${diasCount} día${diasCount !== 1 ? 's' : ''}/sem</p>
              <p style="font-size:.55rem;color:var(--clases-muted);font-weight:600">${totalSlots} horario${totalSlots !== 1 ? 's' : ''}</p>
            </div>
          </div>
          ${profesores ? `<div style="font-size:.58rem;color:var(--clases-muted);font-weight:600;margin-bottom:.6rem;padding:.3rem .5rem;background:rgba(255,255,255,.03);border-radius:5px">👤 ${profesores}</div>` : ''}
          <div style="border-top:1px solid var(--clases-border);padding-top:.7rem">
            ${diasHtml}
          </div>
        </div>`;
    }).join('');

    document.getElementById('vistaAlumnoGridClases').innerHTML = html ||
        '<p style="color:var(--clases-muted);font-size:.8rem;font-weight:600;padding:2rem;grid-column:1/-1;text-align:center">Sin clases configuradas</p>';
};

function initClasesListeners() {
    const db = window.db;

// ── FIREBASE LISTENERS ──
db.collection('catalogo').where('tipo', '==', 'clase').onSnapshot(snap => {
    fbDocsMapClases = new Map();
    snap.docs.forEach(d => {
        const x = d.data();
        const k = fbKeyClase(x.nombre, x.inicio + '-' + x.fin, x.dia || '');
        fbDocsMapClases.set(k, { ...x, id: d.id });
        if (x.profesor) profesoresLocalClases[k] = x.profesor;
    });
    clasesEnFirebaseClases = new Set(fbDocsMapClases.keys());
    document.getElementById('hTotalClases').innerText = snap.size;

    if (!firebaseInitedClases && snap.size > 0) {
        initHorariosFromFirebaseClases();
    }
    firebaseInitedClases = true;

    renderGridClases(HORARIO_FITNESS_CLASES, 'gridClasesFitness', 'fitness');
    renderGridClases(HORARIO_GIMNASIA_CLASES, 'gridClasesGimnasia', 'gimnasia');
    recalcPlanasClases();

    if (celdaActivaClases) {
        renderEditPanelClases(celdaActivaClases.hora, celdaActivaClases.dia, celdaActivaClases.area, celdaActivaClases.franjaIdx);
    }
});

db.collection('alumnos').onSnapshot(s => document.getElementById('hTotalAlumnosClases').innerText = s.size);

// Cargar costos desde Firebase
cargarCostosClases();
}


// ── INIT CLASES ── (solo render inicial, sin Firebase)
renderGridClases(HORARIO_FITNESS_CLASES, 'gridClasesFitness', 'fitness');
renderGridClases(HORARIO_GIMNASIA_CLASES, 'gridClasesGimnasia', 'gimnasia');
recalcPlanasClases();
// cargarCostosClases() se llama desde initClasesListeners() una vez que Firebase está listo

// ══════════════════════════════════════════════════════════════════
// FIN MÓDULO: ADMIN DE CLASES
// ══════════════════════════════════════════════════════════════════


// ── EXPONER FUNCIONES GLOBALES (onclick en HTML) ──
    if (typeof abrirEditar === 'function') window.abrirEditar = abrirEditar;
    if (typeof buscarAlumnoEnClases === 'function') window.buscarAlumnoEnClases = buscarAlumnoEnClases;
    if (typeof cancelarMover === 'function') window.cancelarMover = cancelarMover;
    if (typeof cerrarCeldaClase === 'function') window.cerrarCeldaClase = cerrarCeldaClase;
    if (typeof cerrarPanel === 'function') window.cerrarPanel = cerrarPanel;
    if (typeof cerrarPanelDiscip === 'function') window.cerrarPanelDiscip = cerrarPanelDiscip;
    if (typeof ejecutarMover === 'function') window.ejecutarMover = ejecutarMover;
    if (typeof eliminarClaseEdit === 'function') window.eliminarClaseEdit = eliminarClaseEdit;
    if (typeof filtrarArea === 'function') window.filtrarArea = filtrarArea;
    if (typeof filtrarClaseInput === 'function') window.filtrarClaseInput = filtrarClaseInput;
    if (typeof guardarClaseEdit === 'function') window.guardarClaseEdit = guardarClaseEdit;
    if (typeof switchPanel === 'function') window.switchPanel = switchPanel;

