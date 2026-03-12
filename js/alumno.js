// =================================================================
// IBIME GYMNASTICS CLUB — Módulo de Alumno (Portal)
// alumno.js: login, portal, membresía, clases, carrito, historial
// Requiere: window.db (Firebase Firestore compat) seteado por auth.js
// =================================================================

    // ====== MODULO ALUMNO ======
// ─── MÓDULO ALUMNO ───────────────────────────────────────────────
// db and rtdb are accessed lazily (initialized after Firebase is ready)
let rtdb = null;
function getRtdb() {
    if (!rtdb && window.firebase) rtdb = firebase.database();
    return rtdb;
}


var URL_GAS_ALUMNO="https://script.google.com/macros/s/AKfycbwZg7nmuTA27A3rT6Pn6uDyfB4eyzbrFP5js09VNC1L-iMqG__DIvlFS59oH90HHu1Q/exec";
const INSCRIPCION_MONTO=800;
// Paquetes: clases → {n: precio normal, p: precio pronto pago}
const PAQUETES_FITNESS  ={1:{n:700,p:630},2:{n:1300,p:1170},3:{n:1800,p:1620},4:{n:2200,p:1980},5:{n:2600,p:2340}};
const PAQUETES_GIMNASIA ={1:{n:850,p:765},2:{n:1600,p:1440},3:{n:2200,p:1980},4:{n:2750,p:2475},5:{n:3200,p:2880}};
const PKG_OPTS=[1,2,3,4,5];
const $al=id=>document.getElementById(id);




let USER=null,CART=[],CATALOGO=[],MIS_RESERVAS=[],ORDEN_ACTIVA=null;
let AREA_SEL=null,DISCIPS_SEL=new Set(),PKG=1;

// ════════════════════════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════════════════════════
function toastAl(msg,ms=3000){const t=$al('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),ms);}

// ════════════════════════════════════════════════════════════════
// LOGIN HELPERS
// ════════════════════════════════════════════════════════════════
function switchLTab(t){
    ['login','reset'].forEach(k=>{
        $al('ltab-'+k).classList.toggle('active',k===t);
        $al('lpanel-'+k).classList.toggle('on',k===t);
    });
}
function toggleEye(id,btn){const i=$al( id);const s=i.type==='password';i.type=s?'text':'password';btn.innerHTML=s?'<i class="fa-solid fa-eye-slash"></i>':'<i class="fa-solid fa-eye"></i>';}
function showLErr(panel,msg){const e=$al('lerr-'+panel),s=$al('lerr-'+panel+'-msg');s.textContent=msg;e.classList.add('on');}
function hideLErr(panel){$al('lerr-'+panel).classList.remove('on');}

// ════════════════════════════════════════════════════════════════
// SESIÓN
// ════════════════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded',()=>{
    const s=localStorage.getItem('ib_session');
    if(s)try{USER=JSON.parse(s);entrarPortal();}catch{localStorage.removeItem('ib_session');}
});

// ════════════════════════════════════════════════════════════════
// DO LOGIN
// ════════════════════════════════════════════════════════════════
async function doLogin(){
    const db = window.db;
    const id=$al( 'li-id').value.trim().toUpperCase();
    const pass=$al( 'li-pass').value.trim();
    const btn=$al( 'btn-login');
    if(!id||!pass){showLErr('login','Completa tu ID y contraseña');return;}
    hideLErr('login');
    btn.disabled=true;btn.innerHTML='<i class="fa-solid fa-spinner fa-spin" style="margin-right:6px"></i>Verificando...';
    try{
        const snap=await db.collection('alumnos').doc(id).get();
        if(!snap.exists){showLErr('login','Matrícula "'+id+'" no encontrada');return;}
        const data=snap.data();
        const ok=String(data.password||'')=== pass||String(data.pin||'')=== pass||Number(data.pin)===Number(pass);
        if(!ok){showLErr('login','Contraseña incorrecta');return;}
        USER={id,...data};
        localStorage.setItem('ib_session',JSON.stringify(USER));
        entrarPortal();
    }catch(e){showLErr('login','Error: '+e.message);}
    finally{btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-arrow-right-to-bracket" style="margin-right:6px"></i>Ingresar';}
}

// ════════════════════════════════════════════════════════════════
// RESTABLECER CONTRASEÑA
// ════════════════════════════════════════════════════════════════
let _rAlumno=null;
async function verificarCURP(){
    const db = window.db;
    const id=$al( 'ri-id').value.trim().toUpperCase();
    const curp=$al( 'ri-curp').value.trim().toUpperCase();
    if(!id||curp.length!==18){showLErr('reset','Ingresa ID y CURP de 18 caracteres');return;}
    const btn=$al( 'btn-verificar');
    btn.disabled=true;btn.innerHTML='<i class="fa-solid fa-spinner fa-spin" style="margin-right:6px"></i>Verificando...';
    try{
        const snap=await db.collection('alumnos').doc(id).get();
        if(!snap.exists){showLErr('reset','Matrícula no encontrada');return;}
        const data=snap.data();
        if(String(data.curp||'?').toUpperCase()!==curp){showLErr('reset','CURP no coincide con el registro');return;}
        _rAlumno={id,...data};
        $al( 'lerr-reset').classList.remove('on');
        $al( 'ri-nueva-wrap').style.display='block';
        btn.style.display='none';
    }catch(e){showLErr('reset','Error: '+e.message);}
    finally{btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-shield-check" style="margin-right:6px"></i>Verificar Identidad';}
}
async function guardarNuevaPass(){
    const db = window.db;
    const p1=$al( 'ri-p1').value;const p2=$al( 'ri-p2').value;
    if(p1.length<6){showLErr('reset','Mínimo 6 caracteres');return;}
    if(p1!==p2){showLErr('reset','Las contraseñas no coinciden');return;}
    if(!_rAlumno)return;
    await db.collection('alumnos').doc(_rAlumno.id).update({password:p1,primerAcceso:false});
    $al( 'lsuccess-msg').textContent='¡Contraseña actualizada! Ya puedes iniciar sesión.';
    $al( 'lsuccess-reset').classList.add('on');
    $al( 'ri-nueva-wrap').style.display='none';
    setTimeout(()=>{switchLTab('login');$al( 'li-id').value=_rAlumno.id;_rAlumno=null;},2000);
}

// ════════════════════════════════════════════════════════════════
// ENTRAR AL PORTAL (animación)
// ════════════════════════════════════════════════════════════════
function entrarPortal(){
    const portal=$al( 'screen-portal');
    portal.classList.add('visible');
    iniciarPortal();
}
function logoutAl(){localStorage.removeItem('ib_session'); document.getElementById('seccionAlumno').classList.remove('active'); document.getElementById('seccionAlumno').style.display='none'; }

// ════════════════════════════════════════════════════════════════
// INICIAR PORTAL
// ════════════════════════════════════════════════════════════════
function iniciarPortal(){
    const db = window.db;
    // Drawer
    $al('drawerNombre').textContent=USER.nombre?.split(' ')[0]||'Alumno';
    $al('drawerID').textContent='ID: '+USER.id;
    $al('drawerAvatar').textContent=USER.nombre?.charAt(0)||'?';
    // Inscripción
    actualizarInscripcion();
    // Credencial
    renderCredencial();
    // Inscripción automática — costo a partir del 01/04/2026
    const _hoyInsc=new Date();
    const _fechaCargoInsc=new Date('2026-04-01');
    const _cobrarInscripcion=_hoyInsc>=_fechaCargoInsc;
    if(!USER.inscripcionPagada){
        if(_cobrarInscripcion){
            if(!CART.find(i=>i.tipo==='inscripcion')){
                CART.unshift({id:'INSCRIPCION',nombre:'Inscripción IBIME',precio:INSCRIPCION_MONTO,icon:'⭐',tipo:'inscripcion'});
                actualizarBadge();
            }
        }
        $al('alertInsc').style.display='flex';
    }
    // Firebase listeners
    db.collection('catalogo').onSnapshot(snap=>{
        CATALOGO=snap.docs.map(d=>({id:d.id,...d.data()}));
        renderProductos();
    });
    db.collection('reservas').where('alumnoId','==',USER.id).onSnapshot(snap=>{
        MIS_RESERVAS=snap.docs.map(d=>({rid:d.id,...d.data()}));
        renderMisClases();
        const nueva=MIS_RESERVAS.find(r=>r.estado==='confirmada'&&!r.alertaMostrada);
        if(nueva){toastAl('🎉 Lugar confirmado en '+nueva.claseNombre);db.collection('reservas').doc(nueva.rid).update({alertaMostrada:true}).catch(()=>{});}
    });
    getRtdb().ref('estatus_acceso/'+USER.id).on('value',snap=>{
        ORDEN_ACTIVA=snap.val();
        $al( 'alertOrden').style.display=(ORDEN_ACTIVA&&ORDEN_ACTIVA.monto>0)?'block':'none';
        if(!ORDEN_ACTIVA)cerrarQR();
    });
    db.collection('alumnos').doc(USER.id).onSnapshot(snap=>{
        if(!snap.exists)return;
        const d=snap.data();
        if(d.fichaMedica){
            const fm=d.fichaMedica;
            $al('medSangre').value=fm.sangre||'';
            $al('medFechaNac').value=fm.fechaNac||'';
            $al('medPeso').value=fm.peso||'';
            $al('medEstatura').value=fm.estatura||'';
            $al('medIMC').value=fm.imc||'';
            $al('medAlergias').value=fm.alergias||'';
            $al('medLesiones').value=fm.lesiones||'';
            $al('medEnfCronicas').value=fm.enfCronicas||'';
            $al('medMedicamentos').value=fm.medicamentos||'';
            $al('medCirugias').value=fm.cirugias||'';
            $al('medVacunas').value=fm.vacunas||'';
            $al('medTieneSeguro').value=fm.tieneSeguro||'';
            $al('medAseguradora').value=fm.aseguradora||'';
            $al('medPoliza').value=fm.poliza||'';
            $al('medMedicoNombre').value=fm.medicoNombre||'';
            $al('medMedicoTel').value=fm.medicoTel||'';
            $al('medEmergenciaNombre').value=fm.emergenciaNombre||'';
            $al('medEmergenciaParentesco').value=fm.emergenciaParentesco||'';
            $al('medEmergenciaTel').value=fm.emergenciaTel||'';
            $al('medEmergenciaTel2').value=fm.emergenciaTel2||'';
            $al('medEmergencia').value=fm.emergencia||'';
            toggleSeguroFields();
        }
        if(d.inscripcionPagada!==undefined){
            USER.inscripcionPagada=d.inscripcionPagada;
            actualizarInscripcion();
            if(d.inscripcionPagada){
                CART=CART.filter(i=>i.tipo!=='inscripcion');
                actualizarBadge();
                $al('alertInsc').style.display='none';
            }
        }
        if(d.estatus)USER.estatus=d.estatus;
        // Contador de clases
        if(d.clasesRestantes!==undefined){
            USER.clasesRestantes=d.clasesRestantes;
            USER.clasesPaquete=d.clasesPaquete||0;
            actualizarContadorClases();
            // Alerta pocas clases
            if(d.clasesRestantes<=2&&d.clasesRestantes>0){
                const alEl=$al('alertPocasClases');
                if(alEl){alEl.style.display='block';alEl.querySelector('.pocas-num').textContent=d.clasesRestantes;}
            } else {
                const alEl=$al('alertPocasClases');if(alEl)alEl.style.display='none';
            }
        }
    });
    // Primer acceso
    if(USER.primerAcceso===true||(!USER.password))setTimeout(()=>$al( 'modalPass').classList.add('on'),800);
}

// ════════════════════════════════════════════════════════════════
// NAV
// ════════════════════════════════════════════════════════════════
function navTo(id,btn){
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('on'));
    $al('view-'+id)?.classList.add('on');
    document.querySelectorAll('.sb-item').forEach(b=>b.classList.remove('on','rojo'));
    if(btn)btn.classList.add('on');
    if(id==='historial')cargarHistorial();
    if(id==='misclases'){}
    const main=$al('main');if(main)main.scrollTop=0;
}
function toggleDrawer(){}

// ════════════════════════════════════════════════════════════════
// MEMBRESÍA
// ════════════════════════════════════════════════════════════════
function actualizarInscripcion(){
    $al('memNombre').textContent=USER.nombre||'';
    const inscrita=USER.inscripcionPagada===true;
    const hoy=new Date();
    const fechaCargo=new Date('2026-04-01');
    const conCargo=hoy>=fechaCargo;
    // ── Stat card ───────────────────────────────────────────────
    const memE=$al('memEstado');
    if(memE){
        memE.textContent=inscrita?'Activa':'Pendiente';
        memE.style.color=inscrita?'#10b981':'#f59e0b';
    }
    // ── Hero card ───────────────────────────────────────────────
    const heroI=$al('memIcono');const heroS=$al('heroInscStatus');
    if(heroI)heroI.textContent=inscrita?'✅':'⏳';
    if(heroS){
        heroS.textContent=inscrita?'Inscripción Activa':'Inscripción Pendiente';
        heroS.style.color=inscrita?'#6ee7b7':'#fbbf24';
    }
    // ── Sidebar mini ────────────────────────────────────────────
    const sbE=$al('sbMemEstado');const sbD=$al('sbMemDias');
    if(sbE){
        sbE.textContent=inscrita?'Inscripción Activa':'Inscripción Pendiente';
        sbE.style.color=inscrita?'#6ee7b7':'#fbbf24';
    }
    if(sbD)sbD.textContent=inscrita?'':(conCargo?'Costo: $800 MXN':'¡Inscripción gratuita!');
    const sc=$al('statCarrito');if(sc)sc.textContent=CART.length;
}

// ════════════════════════════════════════════════════════════════
// CONTADOR DE CLASES
// ════════════════════════════════════════════════════════════════
function actualizarContadorClases(){
    const restantes=USER.clasesRestantes??null;
    const total=USER.clasesPaquete||0;
    const el=$al('contadorClases');
    if(!el||restantes===null)return;
    const pct=total>0?Math.round((restantes/total)*100):0;
    const color=restantes<=2?'#ef4444':restantes<=5?'#f59e0b':'#10b981';
    el.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem">
        <p style="font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--txt2)">Clases del paquete</p>
        <p style="font-size:1rem;font-weight:900;color:${color}">${restantes}<span style="font-size:.65rem;color:var(--txt2);font-weight:600"> / ${total}</span></p>
      </div>
      <div style="height:8px;border-radius:99px;background:#e2e8f0;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${color};border-radius:99px;transition:width .4s"></div>
      </div>
      <p style="font-size:.6rem;color:${color};font-weight:700;margin-top:.4rem;text-align:right">${restantes} clase${restantes!==1?'s':''} restante${restantes!==1?'s':''}</p>
    `;
}


// ════════════════════════════════════════════════════════════════
function renderCredencial(){
    $al( 'cNombre').textContent=USER.nombre||''
    $al( 'cNivel').textContent=USER.nivel||''
    $al( 'cID').textContent=USER.id||''
    $al( 'cPIN').textContent=USER.pin||''
    $al( 'cVence').textContent=USER.inscripcionPagada?'Inscripción Activa ✅':'Inscripción Pendiente ⏳'
    const qr=$al( 'qrCredencial');qr.innerHTML='';
    new QRCode(qr,{text:USER.id,width:150,height:150,colorDark:'#1e3a6e',colorLight:'#ffffff'});
}
function descargarCredencialAl(){html2canvas($al( 'credencialVisual'),{scale:3,useCORS:true}).then(c=>{const a=document.createElement('a');a.download='IBIME_'+USER.nombre+'.png';a.href=c.toDataURL();a.click();});}
function compartirWA(){const m=`*IBIME GYMNASTICS CLUB*\nHola ${USER.nombre}!\nID: *${USER.id}*\nInscripción: ${USER.inscripcionPagada?'Activa':'Pendiente'}`;window.open('https://wa.me/?text='+encodeURIComponent(m),'_blank');}

// ════════════════════════════════════════════════════════════════
// CLASES — PASOS
// ════════════════════════════════════════════════════════════════
function selArea(area){
    AREA_SEL=area;DISCIPS_SEL.clear();PKG=4;
    // Reset step indicators
    setStep(2);
    $al( 'paso-area').style.display='none';
    $al( 'paso-discip').style.display='block';
    $al( 'paso-frec').style.display='none';
    $al( 'paso2-titulo').textContent=area==='fitness'?'🏃 Clases de Fitness':'🤸 Clases de Gimnasia';
    // Colores botón continuar
    const bc=$al( 'btn-continuar-discip');
    bc.className='btn-add '+(area==='fitness'?'fit':'gym');
    renderDiscip();
}

function renderDiscip(){
    const clases=CATALOGO.filter(i=>i.tipo==='clase'&&i.area===AREA_SEL);
    // Agrupar por nombre disciplina (quitar duplicados de horarios)
    const grupos={};
    clases.forEach(c=>{
        if(!grupos[c.nombre])grupos[c.nombre]={nombre:c.nombre,icon:c.icon||'🏋️',count:0,ids:[]};
        grupos[c.nombre].count++;
        grupos[c.nombre].ids.push(c.id);
    });
    const esFit=AREA_SEL==='fitness';
    $al( 'listDiscip').innerHTML=Object.values(grupos).sort((a,b)=>a.nombre.localeCompare(b.nombre)).map(gr=>{
        const sel=gr.ids.some(id=>DISCIPS_SEL.has(id));
        const yaRes=gr.ids.some(id=>MIS_RESERVAS.some(r=>r.claseId===id));
        const cls=sel?(esFit?'sel-fit':'sel-gym'):'';
        const bgSel=sel?(esFit?'background:linear-gradient(135deg,#fff2f1,white);border-color:var(--rojo)':'background:linear-gradient(135deg,#eef3ff,white);border-color:var(--azul)'):'';
        const chkColor=sel?(esFit?'background:var(--rojo);border-color:var(--rojo)':'background:var(--azul);border-color:var(--azul)'):'border:2px solid #cbd5e1';
        return`<div style="display:flex;align-items:center;justify-content:space-between;padding:.9rem 1rem;border-radius:14px;border:2px solid var(--border);background:white;cursor:pointer;transition:all .2s;${bgSel}" onclick="toggleDiscip('${gr.nombre}')">
          <div style="display:flex;align-items:center;gap:.75rem">
            <span style="font-size:1.5rem;width:36px;text-align:center">${gr.icon}</span>
            <div>
              <p style="font-weight:900;font-size:.85rem;text-transform:uppercase;letter-spacing:.02em">${gr.nombre}</p>
              <p style="font-size:.62rem;color:${yaRes?'#059669':sel?'var(--azul)':'var(--txt2)'};font-weight:700;margin-top:1px">${yaRes?'✓ Ya estás inscrito':gr.count+' horario'+(gr.count>1?'s':'')+' disponibles'}</p>
            </div>
          </div>
          <div style="width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s;${sel||yaRes?chkColor:(yaRes?'background:#059691;border:none':'border:2px solid #cbd5e1')};color:white;font-size:.65rem">
            ${sel||yaRes?'<i class="fa-solid fa-check"></i>':''}
          </div>
        </div>`;
    }).join('')||'<p style="text-align:center;color:var(--txt2);font-size:.8rem;padding:2rem;font-weight:600">Sin clases disponibles en esta área</p>';
    actualizarContinuarDiscip();
    // Badge contador
    const n=DISCIPS_SEL.size;
    const badge=$al('badge-sel-count');
    if(badge){if(n>0){badge.style.display='inline-block';badge.textContent=n+' seleccionada'+(n>1?'s':'');}else badge.style.display='none';}
}

function toggleDiscip(nombre){
    const clases=CATALOGO.filter(i=>i.tipo==='clase'&&i.area===AREA_SEL&&i.nombre===nombre);
    if(!clases.length)return;
    const yaRes=clases.some(c=>MIS_RESERVAS.some(r=>r.claseId===c.id));
    if(yaRes){toastAl('ℹ️ Ya estás inscrito en esta disciplina');return;}
    // Toggle: si alguno está seleccionado, des-seleccionar todos; si ninguno, seleccionar todos
    const alguno=clases.some(c=>DISCIPS_SEL.has(c.id));
    clases.forEach(c=>alguno?DISCIPS_SEL.delete(c.id):DISCIPS_SEL.add(c.id));
    renderDiscip();
}

function actualizarContinuarDiscip(){
    const btn=$al('btn-continuar-discip');
    if(!btn)return;
    const n=DISCIPS_SEL.size;
    const esFit=AREA_SEL==='fitness';
    if(n>0){
        btn.style.display='block';
        btn.textContent='Continuar con '+n+' disciplina'+(n>1?'s':'')+ ' → Elegir paquete';
        btn.style.background=esFit?'var(--rojo)':'var(--azul)';
        btn.style.boxShadow=esFit?'0 4px 16px rgba(200,56,42,.3)':'0 4px 16px rgba(30,58,110,.3)';
    }else btn.style.display='none';
}

function irPaso3(){
    if(!DISCIPS_SEL.size){toastAl('Selecciona al menos una disciplina');return;}
    setStep(3);
    $al( 'paso-discip').style.display='none';
    $al( 'paso-frec').style.display='block';
    renderPaquetes();
}

function volverPaso(n){
    setStep(n);
    $al( 'paso-area').style.display=n===1?'block':'none';
    $al( 'paso-discip').style.display=n===2?'block':'none';
    $al( 'paso-frec').style.display=n===3?'block':'none';
    if(n===2)renderDiscip();
}

function setStep(active){
    for(let i=1;i<=3;i++){
        const s=$al( 'step-'+i);
        s.classList.toggle('active',i===active);
        s.classList.toggle('done',i<active);
    }
}

function renderPaquetes(){
    const esFit=AREA_SEL==='fitness';
    const tabla=esFit?PAQUETES_FITNESS:PAQUETES_GIMNASIA;
    // Resumen disciplinas
    const nombres=[...new Set([...DISCIPS_SEL].map(id=>{const it=CATALOGO.find(c=>c.id===id);return it?.nombre||'';}))];
    const rEl=$al('discip-resumen');
    rEl.style.borderColor=esFit?'var(--rojo)':'var(--azul)';
    rEl.style.background=esFit?'linear-gradient(135deg,#fff5f4,white)':'linear-gradient(135deg,#eef3ff,white)';
    const _bg=esFit?'#fff2f1':'#eef3ff';const _icon=esFit?'🏃':'🤸';const _area=esFit?'Fitness':'Gimnasia';
    rEl.innerHTML=`<div style="width:36px;height:36px;border-radius:10px;background:${_bg};display:flex;align-items:center;justify-content:center;font-size:1.2rem">${_icon}</div><div style="flex:1"><p style="font-weight:900;font-size:.78rem;text-transform:uppercase">${_area}</p><p style="font-size:.65rem;color:#64748b;font-weight:600">${nombres.join(' &middot; ')}</p></div><button onclick="volverPaso(2)" style="font-size:.6rem;color:#64748b;background:none;border:1px solid #e2e8f0;border-radius:8px;padding:3px 8px;cursor:pointer">Cambiar</button>`;
    // Botones frecuencia semanal
    let html='';
    for(const n of PKG_OPTS){
        const c=tabla[n];
        const sel=PKG===n;
        const totalMes=n*4;
        html+=`<button onclick="setPkg(${n})" class="frec-btn ${sel?'on '+(esFit?'fit':'gym'):''}">
          ${n}/sem<span class="frec-sub">${totalMes} cl/mes</span>
        </button>`;
    }
    $al('frecGrid').innerHTML=html;
    actualizarPrecio();
    const pbox=$al('precioBox');
    if(pbox)pbox.style.background=esFit?'linear-gradient(135deg,var(--rojo),var(--rojo2,#a02220))':'linear-gradient(135deg,var(--azul),var(--azul2))';
    const btn=$al('btnAddCart');
    btn.style.background=esFit?'var(--rojo)':'var(--azul)';
    btn.style.boxShadow=esFit?'0 4px 16px rgba(200,56,42,.3)':'0 4px 16px rgba(30,58,110,.3)';
}

function setPkg(n){PKG=n;renderPaquetes();}

function actualizarPrecio(){
    const tabla=AREA_SEL==='fitness'?PAQUETES_FITNESS:PAQUETES_GIMNASIA;
    const c=tabla[PKG]||tabla[4];
    $al( 'precioNormal').textContent='$'+c.n.toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});
    $al( 'precioPromo').textContent='$'+c.p.toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});
}

function agregarAlCarrito(){
    if(ORDEN_ACTIVA){toastAl('⚠️ Tienes un pago pendiente');return;}
    const tabla=AREA_SEL==='fitness'?PAQUETES_FITNESS:PAQUETES_GIMNASIA;
    const c=tabla[PKG]||tabla[4];
    const esFit=AREA_SEL==='fitness';
    // Quitar mensualidad anterior de esta área
    CART=CART.filter(x=>!(x.tipo==='mensualidad'&&x.area===AREA_SEL));
    const nombres=[...new Set([...DISCIPS_SEL].map(id=>{const it=CATALOGO.find(c=>c.id===id);return it?.nombre||'';}))];
    CART.push({
        id:'MEN-'+AREA_SEL,
        nombre:'Paquete '+(esFit?'Fitness':'Gimnasia')+' — '+PKG+'/sem ('+PKG*4+' clases/mes)',
        precio:c.p,icon:esFit?'🏃':'🤸',tipo:'mensualidad',area:AREA_SEL,
        frecuenciaSem:PKG,numClases:PKG*4,clasesIds:[...DISCIPS_SEL],clasesNombres:nombres
    });
    actualizarBadge();
    toastAl('🛒 Agregado al carrito');
    // Volver al paso 1
    volverPaso(1);
    setStep(1);
    $al( 'paso-area').style.display='block';
    $al( 'paso-discip').style.display='none';
    $al( 'paso-frec').style.display='none';
    DISCIPS_SEL.clear();
    abrirCarrito();
}

// ════════════════════════════════════════════════════════════════
// PRODUCTOS
// ════════════════════════════════════════════════════════════════
function renderProductos(){
    const prods=CATALOGO.filter(i=>i.tipo==='producto');
    $al( 'gridProductos').innerHTML=prods.length===0?'<p style="text-align:center;color:var(--txt2);font-size:.8rem;font-weight:600;padding:2rem;grid-column:1/-1">Sin productos disponibles</p>':
    prods.map(p=>`<div onclick="toggleProd('${p.id}')" class="card" style="padding:1rem;text-align:center;cursor:pointer;border:2px solid ${CART.some(c=>c.id===p.id)?'var(--azul)':'var(--border)'};background:${CART.some(c=>c.id===p.id)?'#eef3ff':'white'};transition:all .2s">
        <div style="font-size:2rem;margin-bottom:.4rem">${p.icon||'📦'}</div>
        <p style="font-weight:800;font-size:.75rem;text-transform:uppercase;margin-bottom:.3rem">${p.nombre}</p>
        <p style="font-weight:900;font-size:1rem;color:var(--azul)">$${p.precio}</p>
    </div>`).join('');
}

function toggleProd(id){
    if(ORDEN_ACTIVA){toastAl('⚠️ Tienes un pago pendiente');return;}
    const it=CATALOGO.find(c=>c.id===id);if(!it)return;
    const idx=CART.findIndex(c=>c.id===id);
    if(idx>-1){CART.splice(idx,1);toastAl(it.nombre+' quitado');}
    else{CART.push({id,nombre:it.nombre,precio:it.precio,icon:it.icon||'📦',tipo:'producto'});toastAl(it.nombre+' agregado ✅');}
    actualizarBadge();renderProductos();
}

// ════════════════════════════════════════════════════════════════
// CARRITO
// ════════════════════════════════════════════════════════════════
function actualizarBadge(){
    const b=$al('cartBadge');const n=CART.length;
    if(b){b.textContent=n;b.style.display=n?'flex':'none';}
    const sc=$al('statCarrito');if(sc)sc.textContent=n;
}
function abrirCarrito(){
    if(!CART.length){toastAl('🛒 El carrito está vacío');return;}
    let total=0;
    const tieneClases=CART.some(i=>i.tipo==='clase'||i.tipo==='mensualidad');
    $al( 'cartItems').innerHTML=CART.map(i=>{
        total+=i.precio;
        const sub=i.tipo==='mensualidad'?'<p style="font-size:.62rem;color:var(--azul);font-weight:600;margin-top:2px">📅 '+( i.clasesNombres||[]).join(', ')+'</p>':i.tipo==='inscripcion'?'<p style="font-size:.62rem;color:#f59e0b;font-weight:600;margin-top:2px">Cuota única</p>':'';
        return`<div style="display:flex;justify-content:space-between;align-items:start;padding:.7rem .9rem;background:#f8fafc;border-radius:10px;border:1px solid var(--border);margin-bottom:.4rem">
          <div style="display:flex;gap:.6rem;align-items:start">
            <span style="font-size:1.2rem">${i.icon}</span>
            <div><p style="font-weight:800;font-size:.78rem">${i.nombre}</p>${sub}</div>
          </div>
          <p style="font-weight:900;font-size:.9rem;color:var(--azul);white-space:nowrap;margin-left:.5rem">$${i.precio.toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2})}</p>
        </div>`;
    }).join('');
    $al( 'cartTotal').textContent='$'+total.toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});
    $al( 'aviso-clases').style.display=tieneClases?'block':'none';
    $al( 'modalCart').classList.add('on');
}

async function confirmarOrden(){
    const db = window.db;
    if(!CART.length)return;
    const btn=document.querySelector('#modalCart .cart-sheet button:last-child');
    if(btn){btn.disabled=true;btn.textContent='Procesando...';}
    try{
        let num=1;
        await db.runTransaction(async tx=>{
            const ref=db.collection('config').doc('contador_pagos');
            const s=await tx.get(ref);num=s.exists?(s.data().ultimo_numero||0)+1:1;
            tx.set(ref,{ultimo_numero:num},{merge:true});
        });
        const folio='IBY-PAG-'+String(num).padStart(10,'0');
        // Pre-reservar clases de mensualidades
        for(const item of CART.filter(i=>i.tipo==='mensualidad'&&i.clasesIds)){
            for(const cid of item.clasesIds){
                const cl=CATALOGO.find(x=>x.id===cid);if(!cl)continue;
                await db.runTransaction(async tx=>{
                    const ref=db.collection('catalogo').doc(cid);
                    const s=await tx.get(ref);if(!s.exists)return;
                    const disp=s.data().cupoDisponible??s.data().cupo??0;
                    if(disp>0)tx.update(ref,{cupoDisponible:firebase.firestore.FieldValue.increment(-1)});
                });
                await db.collection('reservas').add({
                    alumnoId:USER.id,alumnoNombre:USER.nombre,
                    claseId:cid,claseNombre:cl.nombre,area:cl.area||item.area,
                    folio,estado:'pre-reserva',alertaMostrada:false,timestamp:Date.now(),
                    frecuenciaSem:item.frecuencia||null
                });
            }
        }
        const total=CART.reduce((s,i)=>s+i.precio,0);
        const detalle=CART.map(i=>i.nombre).join(', ');
        const tieneInsc=CART.some(i=>i.tipo==='inscripcion');
        const orden={id:USER.id,nombre:USER.nombre,monto:total,detalle,folio,tieneInscripcion:tieneInsc,fecha:new Date().toLocaleDateString('es-MX'),timestamp:Date.now()};
        await getRtdb().ref('estatus_acceso/'+USER.id).set(orden);
        fetch(URL_GAS_ALUMNO,{method:'POST',mode:'no-cors',body:JSON.stringify({accion:'REGISTRAR_PAGO',id:USER.id,nombre:USER.nombre,adicionales:detalle,idCarrito:folio,monto:total,metodo:'APP_PENDIENTE'})}).catch(()=>{});
        CART=[];actualizarBadge();
        $al( 'modalCart').classList.remove('on');
        mostrarQR(orden);
    }catch(e){toastAl('❌ '+e.message,4000);}
    finally{if(btn){btn.disabled=false;btn.textContent='Confirmar';}}
}

// ════════════════════════════════════════════════════════════════
// QR PAGO
// ════════════════════════════════════════════════════════════════
function mostrarQR(data){
    $al( 'qrFolio').textContent='FOLIO: '+data.folio;
    $al( 'qrMonto').textContent='$'+data.monto.toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});
    $al( 'qrPagoContainer').innerHTML='';
    $al( 'modalQR').classList.add('on');
    setTimeout(()=>new QRCode($al( 'qrPagoContainer'),{text:`${data.id}|${data.folio}|${data.monto}`,width:160,height:160}),200);
}
function verQROrden(){if(ORDEN_ACTIVA)mostrarQR(ORDEN_ACTIVA);}
function cerrarQR(){$al( 'modalQR').classList.remove('on');$al( 'qrPagoContainer').innerHTML='';}
async function cancelarOrden(){if(!confirm('¿Cancelar la orden pendiente?'))return;await getRtdb().ref('estatus_acceso/'+USER.id).remove();toastAl('Orden cancelada');}

// ════════════════════════════════════════════════════════════════
// MIS CLASES
// ════════════════════════════════════════════════════════════════
function renderMisClases(){
    const sm=$al('statMisClases');if(sm)sm.textContent=MIS_RESERVAS.length;
    const l=$al('listaMisClases');
    if(!MIS_RESERVAS.length){
        l.innerHTML='<div class="card" style="padding:2rem;text-align:center;"><div style="font-size:2.5rem;margin-bottom:.75rem">📅</div><p style="font-weight:800;font-size:.85rem;color:#64748b">Sin clases reservadas</p><button onclick="navTo(String.fromCharCode(39)+\'clases\'+String.fromCharCode(39))" onclick="navTo(\'clases\')" style="margin-top:.75rem;padding:.6rem 1.2rem;background:#1e3a6e;color:white;border:none;border-radius:10px;font-size:.72rem;font-weight:800;text-transform:uppercase;cursor:pointer">Explorar Clases</button></div>';
        return;
    }
    const grupos={};
    MIS_RESERVAS.forEach(r=>{
        const k=r.claseNombre||'Clase';
        if(!grupos[k])grupos[k]={nombre:k,area:r.area,reservas:[]};
        grupos[k].reservas.push(r);
    });
    let html='';
    Object.values(grupos).forEach(g=>{
        const conf=g.reservas.filter(r=>r.estado==='confirmada'||r.estado==='asistio').length;
        const enCurso=g.reservas.filter(r=>r.estado==='en_curso').length;
        const noAsistio=g.reservas.filter(r=>r.estado==='no_asistio').length;
        const total=g.reservas.length;
        const esFit=(g.area||'')==='fitness';
        const color=esFit?'#c8382a':'#1e3a6e';
        const pct=total>0?Math.round((conf/total)*100):0;
        const preres=g.reservas.find(r=>r.estado==='pre-reserva'||r.estado==='pendiente');
        const cancelBtn=preres?('<button onclick="cancelarReserva(\''+preres.rid+'\',' + '\''+preres.claseId+'\')" style="font-size:.6rem;font-weight:800;color:#ef4444;background:none;border:none;cursor:pointer;text-transform:uppercase;padding:0;margin-top:.4rem"><i class="fa-solid fa-trash-can" style="margin-right:3px"></i>Cancelar pre-reserva</button>'):'';
        const badgeCls=enCurso>0?'badge-amber':noAsistio>0?'badge-red':conf===total&&total>0?'badge-green':'badge-amber';
        const badgeTxt=enCurso>0?'🟡 Clase en curso':noAsistio>0?('❌ '+noAsistio+' no asistió'):conf===total&&total>0?'✅ Confirmadas':('⏳ '+conf+' / '+total);
        html+='<div class="card" style="padding:1rem;margin-bottom:.6rem">'
            +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.6rem">'
            +'<div style="display:flex;align-items:center;gap:.6rem">'
            +'<div style="width:36px;height:36px;border-radius:10px;background:'+(esFit?'#fff2f1':'#eef3ff')+';display:flex;align-items:center;justify-content:center;font-size:1.2rem">'+(esFit?'🏃':'🤸')+'</div>'
            +'<div><p style="font-weight:900;font-size:.85rem;text-transform:uppercase">'+g.nombre+'</p>'
            +'<p style="font-size:.6rem;font-weight:700;color:#64748b">'+(g.area||'').toUpperCase()+'</p></div></div>'
            +'<div style="text-align:right">'
            +'<p style="font-size:1.1rem;font-weight:900;color:'+color+'">'+conf+'<span style="font-size:.7rem;color:#64748b;font-weight:700"> / '+total+'</span></p>'
            +'<p style="font-size:.55rem;font-weight:700;color:#64748b;text-transform:uppercase">confirmadas / inscritas</p></div></div>'
            +'<div style="height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;margin-bottom:.4rem">'
            +'<div style="height:100%;width:'+pct+'%;background:'+color+';border-radius:99px;transition:width .4s ease"></div></div>'
            +'<div style="display:flex;justify-content:space-between;align-items:center">'
            +'<span style="font-size:.58rem;font-weight:700;color:#64748b">'+total+' inscripci'+(total===1?'ón':'ones')+' este mes</span>'
            +'<span class="badge '+badgeCls+'">'+badgeTxt+'</span></div>'
            +cancelBtn
            +'</div>';
    });
    l.innerHTML=html;
}

async function cancelarReserva(rid,cid){
    const db = window.db;
    if(!confirm('¿Cancelar esta reserva?'))return;
    try{
        await db.collection('catalogo').doc(cid).update({cupoDisponible:firebase.firestore.FieldValue.increment(1)});
        await db.collection('reservas').doc(rid).delete();
        toastAl('Reserva cancelada');
    }catch{toastAl('❌ Error al cancelar');}
}

// ════════════════════════════════════════════════════════════════
// HISTORIAL
// ════════════════════════════════════════════════════════════════
async function cargarHistorial(){
    const db = window.db;
    const l=$al( 'listaHistorial');
    l.innerHTML='<p style="text-align:center;font-size:.75rem;color:var(--txt2);padding:2rem;font-weight:600">Cargando...</p>';
    try{
        const snap=await db.collection('pagos').where('alumnoId','==',USER.id).orderBy('fecha','desc').get();
        if(snap.empty){l.innerHTML='<div class="card" style="padding:2rem;text-align:center"><p style="font-weight:700;font-size:.8rem;color:var(--txt2)">Sin historial de pagos</p></div>';return;}
        l.innerHTML=snap.docs.map(d=>{const p=d.data();return`<div class="card" style="padding:1rem;margin-bottom:.6rem;border-top:3px solid var(--azul)">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:.4rem">
            <p style="font-size:.65rem;font-weight:800;color:var(--azul);text-transform:uppercase">${p.fechaString||'Reciente'}</p>
            <span class="badge badge-green">${p.metodo||'PAGADO'}</span>
          </div>
          <p style="font-weight:700;font-size:.8rem;margin-bottom:.5rem">${p.detalle||'Consumo'}</p>
          <p style="font-weight:900;font-size:1.3rem;color:var(--azul)">$${p.monto}</p>
        </div>`;}).join('');
    }catch{l.innerHTML='<p style="text-align:center;color:#ef4444;font-size:.75rem;padding:1rem">Error — verifica índices en Firebase</p>';}
}

// ════════════════════════════════════════════════════════════════
// FICHA MÉDICA
// ════════════════════════════════════════════════════════════════
async function guardarFicha(){
    const db = window.db;
    const datos={
        sangre:$al('medSangre').value.toUpperCase(),
        fechaNac:$al('medFechaNac').value,
        peso:$al('medPeso').value,
        estatura:$al('medEstatura').value,
        imc:$al('medIMC').value,
        alergias:$al('medAlergias').value,
        lesiones:$al('medLesiones').value,
        enfCronicas:$al('medEnfCronicas').value,
        medicamentos:$al('medMedicamentos').value,
        cirugias:$al('medCirugias').value,
        vacunas:$al('medVacunas').value,
        tieneSeguro:$al('medTieneSeguro').value,
        aseguradora:$al('medAseguradora').value,
        poliza:$al('medPoliza').value,
        medicoNombre:$al('medMedicoNombre').value,
        medicoTel:$al('medMedicoTel').value,
        emergenciaNombre:$al('medEmergenciaNombre').value,
        emergenciaParentesco:$al('medEmergenciaParentesco').value,
        emergenciaTel:$al('medEmergenciaTel').value,
        emergenciaTel2:$al('medEmergenciaTel2').value,
        emergencia:$al('medEmergencia').value
    };
    try{await db.collection('alumnos').doc(USER.id).update({fichaMedica:datos});toastAl('💉 Ficha guardada');}
    catch{toastAl('❌ Error al guardar');}
}
function calcularIMC(){
    const p=parseFloat($al('medPeso').value);
    const e=parseFloat($al('medEstatura').value);
    if(p>0&&e>0){const imc=(p/((e/100)**2)).toFixed(1);$al('medIMC').value=imc;}else{$al('medIMC').value='';}
}
function toggleSeguroFields(){
    const v=$al('medTieneSeguro').value;
    const f=$al('seguroFields');
    if(f)f.style.display=v==='si'?'block':'none';
}

// ════════════════════════════════════════════════════════════════
// PRIMER ACCESO — CAMBIO CONTRASEÑA
// ════════════════════════════════════════════════════════════════
async function guardarPrimerPass(){
    const db = window.db;
    const p1=$al( 'mp-p1').value,p2=$al( 'mp-p2').value;
    const errEl=$al( 'passErr'),errMsg=$al( 'passErrMsg');
    if(p1.length<6){errMsg.textContent='Mínimo 6 caracteres';errEl.classList.add('on');return;}
    if(p1!==p2){errMsg.textContent='Las contraseñas no coinciden';errEl.classList.add('on');return;}
    errEl.classList.remove('on');
    try{
        await db.collection('alumnos').doc(USER.id).update({password:p1,primerAcceso:false});
        USER.password=p1;USER.primerAcceso=false;
        localStorage.setItem('ib_session',JSON.stringify(USER));
        $al( 'modalPass').classList.remove('on');
        toastAl('🔐 Contraseña guardada. ¡Bienvenido!',4000);
    }catch(e){errMsg.textContent='Error: '+e.message;errEl.classList.add('on');}
}


    // ── EXPONER GLOBALES MÓDULO ALUMNO ──
    if (typeof abrirCarrito === 'function') window.abrirCarrito = abrirCarrito;
    if (typeof agregarAlCarrito === 'function') window.agregarAlCarrito = agregarAlCarrito;
    if (typeof cancelarOrden === 'function') window.cancelarOrden = cancelarOrden;
    if (typeof cerrarQR === 'function') window.cerrarQR = cerrarQR;
    if (typeof compartirWA === 'function') window.compartirWA = compartirWA;
    if (typeof confirmarOrden === 'function') window.confirmarOrden = confirmarOrden;
    if (typeof descargarCredencialAl === 'function') window.descargarCredencialAl = descargarCredencialAl;
    if (typeof doLogin === 'function') window.doLogin = doLogin;
    if (typeof guardarFicha === 'function') window.guardarFicha = guardarFicha;
    if (typeof guardarNuevaPass === 'function') window.guardarNuevaPass = guardarNuevaPass;
    if (typeof guardarPrimerPass === 'function') window.guardarPrimerPass = guardarPrimerPass;
    if (typeof irPaso3 === 'function') window.irPaso3 = irPaso3;
    if (typeof logoutAl === 'function') window.logoutAl = logoutAl;
    if (typeof navTo === 'function') window.navTo = navTo;
    if (typeof selArea === 'function') window.selArea = selArea;
    if (typeof switchLTab === 'function') window.switchLTab = switchLTab;
    if (typeof toggleEye === 'function') window.toggleEye = toggleEye;
    if (typeof verQROrden === 'function') window.verQROrden = verQROrden;
    if (typeof verificarCURP === 'function') window.verificarCURP = verificarCURP;
    if (typeof volverPaso === 'function') window.volverPaso = volverPaso;

// ─── FIN MÓDULO ALUMNO ─────────────────────────────────────────
