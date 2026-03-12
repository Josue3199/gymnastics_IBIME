// =================================================================
// IBIME GYMNASTICS CLUB — Módulo de Recepción
// recepcion.js: registro, caja, alumnos, clases, ingresos
// Requiere: window.db (Firebase Firestore compat) seteado por auth.js
// =================================================================

    // ====== MODULO RECEPCION ======


const URL_GAS="https://script.google.com/macros/s/AKfycbwZg7nmuTA27A3rT6Pn6uDyfB4eyzbrFP5js09VNC1L-iMqG__DIvlFS59oH90HHu1Q/exec";
const PALABRAS_MEMBRESIA=["MENSUALIDAD","CLASE","INSCRIPCION","PLAN","MEMBRESIA","RENOVACION"];
const MEMBRESIA_DIAS=30;
const $r=id=>document.getElementById(id);


// rtdb se inicializa en initRecepcion()

let alumnosCached=[],alumnoActualID=null,alumnoExistente=null;
let scannerCaja=null,scannerActivo=false;
let clasesCached=[],claseActualID=null,claseViendoID=null;
let alumnoMoverID=null,alumnoMoverReservaID=null;
let areaFiltro='todo';

// ── TOAST ────────────────────────────────────────────────────────
function toast(m,ms=3000){const t=$r('toast');t.textContent=m;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),ms);}

// ── NAV ──────────────────────────────────────────────────────────
function showView(id,btn){
    const rec = document.getElementById('seccionRecepcion');
    if(rec) rec.querySelectorAll('.view').forEach(v=>v.classList.remove('on'));
    const target = $r('view-'+id);
    if(target) target.classList.add('on');
    document.querySelectorAll('.rec-nav-btn').forEach(b=>b.classList.remove('on','rojo'));
    if(btn){btn.classList.add('on');}
    if(id==='alumnos')cargarAlumnos();
    if(id==='clases')renderGridDiscip();
}

// ── RELOJ ────────────────────────────────────────────────────────
setInterval(()=>{const _r=$r('reloj');if(_r)_r.textContent=new Date().toLocaleTimeString('es-MX');},1000);

// ── DASHBOARD ────────────────────────────────────────────────────
function initRecepcion() {
    // Inicializa listeners Firebase del módulo Recepción
    const db = window.db;
    const rtdb = firebase.database();

db.collection('alumnos').onSnapshot(snap=>{
    const hoy=new Date();let a=0,v=0;
    snap.forEach(d=>{const vf=d.data().vencimiento?new Date(d.data().vencimiento):new Date(0);vf>hoy?a++:v++;});
    $r('dTotal').textContent=snap.size;$r('dActivos').textContent=a;$r('dVencidos').textContent=v;
    const en7=new Date(hoy);en7.setDate(en7.getDate()+7);
    const prox=snap.docs.filter(d=>{const vf=d.data().vencimiento?new Date(d.data().vencimiento):new Date(0);return vf>hoy&&vf<=en7;});
    $r('listaVenc').innerHTML=prox.length===0?'<p style="text-align:center;font-size:.72rem;color:#94a3b8;font-weight:600;padding:1.5rem">Sin vencimientos próximos</p>':
    prox.map(d=>`<div onclick="showView('caja');$r('cajaBusca').value='${d.id}';buscarAlumnoCaja('${d.id}')" style="padding:.65rem .9rem;background:#fff7f6;border:1px solid #fecaca;border-radius:10px;cursor:pointer;display:flex;justify-content:space-between;align-items:center">
        <div><p style="font-weight:800;font-size:.75rem;text-transform:uppercase">${d.data().nombre}</p><p style="font-size:.6rem;color:var(--rojo);font-weight:600">Vence: ${d.data().vencimiento}</p></div>
        <i class="fa-solid fa-chevron-right" style="color:#fca5a5;font-size:.7rem"></i></div>`).join('');
});

rtdb.ref('estatus_acceso').on('value',snap=>{
    const o=snap.val()||{};const keys=Object.keys(o);
    $r('dOrdenes').textContent=keys.length;
    // Llenar lista de órdenes en caja
    const cajOrd=$r('cajasOrdenes');
    if(cajOrd){
        if(!keys.length){cajOrd.innerHTML='<p style="font-size:.72rem;color:var(--txt2);font-weight:600;text-align:center;padding:1.5rem">Sin órdenes pendientes</p>';}
        else{cajOrd.innerHTML=keys.map(k=>{const ord=o[k];return`<div style="padding:.75rem 1rem;border-radius:12px;background:#f8fafc;border:1.5px solid var(--border);cursor:pointer;transition:all .2s" onclick="buscarAlumnoCaja('${k}')" onmouseover="this.style.borderColor='var(--azul)'" onmouseout="this.style.borderColor='var(--border)'">
            <div style="display:flex;justify-content:space-between;align-items:start">
                <p style="font-weight:900;font-size:.82rem;text-transform:uppercase">${ord.nombre||k}</p>
                <span style="font-weight:900;font-size:.95rem;color:var(--azul)">$${(ord.monto||0).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
            </div>
            <p style="font-size:.6rem;color:var(--txt2);font-weight:600;margin-top:2px">${ord.folio||''} · ${ord.detalle||''}</p>
            <span style="font-size:.58rem;background:#fef9c3;color:#92400e;padding:1px 7px;border-radius:99px;font-weight:800">⏳ Pendiente — clic para cobrar</span>
        </div>`;}).join('');}
    }
    $r('listaOrdenes').innerHTML=keys.length===0?'<p style="text-align:center;font-size:.72rem;color:#94a3b8;font-weight:600;padding:1.5rem">Sin órdenes pendientes</p>':
    keys.map(k=>{const ord=o[k];return`<div onclick="showView('caja');$r('cajaBusca').value='${ord.id||k}';buscarAlumnoCaja('${ord.id||k}')" style="padding:.65rem .9rem;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;cursor:pointer;display:flex;justify-content:space-between;align-items:center">
        <div><p style="font-weight:800;font-size:.75rem;text-transform:uppercase">${ord.nombre||k}</p><p style="font-size:.6rem;color:#d97706;font-weight:600">${ord.detalle||''} · $${ord.monto}</p></div>
        <span class="badge badge-amber">Cobrar</span></div>`;}
    ).join('');
    // Caja lateral
    $r('cajasOrdenes').innerHTML=keys.length===0?'<p style="text-align:center;font-size:.72rem;color:#94a3b8;font-weight:600;padding:2rem">Sin órdenes activas</p>':
    keys.map(k=>{const ord=o[k];return`<div style="padding:.8rem;background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:.4rem">
          <p style="font-weight:900;font-size:.78rem;text-transform:uppercase">${ord.nombre||k}</p>
          <span style="font-size:1rem;font-weight:900;color:#d97706">$${ord.monto}</span>
        </div>
        <p style="font-size:.62rem;color:#92400e;font-weight:600;margin-bottom:.5rem">${ord.detalle||'Sin detalle'}</p>
        <button onclick="$r('cajaBusca').value='${ord.id||k}';buscarAlumnoCaja('${ord.id||k}')" class="btn btn-azul" style="width:100%;justify-content:center;font-size:.65rem"><i class="fa-solid fa-cash-register"></i>Cobrar</button>
    </div>`;}
    ).join('');
});

// ── INGRESO DEL DÍA (cobros reales) ─────────────────────────────
const hoyStr=new Date().toLocaleDateString('es-MX');
db.collection('pagos').where('fechaString','==',hoyStr).onSnapshot(snap=>{
    let total=0,ef=0,tf=0;
    snap.forEach(d=>{const p=d.data();total+=(p.monto||0);if(p.metodo==='EFECTIVO')ef+=(p.monto||0);else tf+=(p.monto||0);});
    const fmt=n=>'$'+n.toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});
    $r('dIngreso').textContent=fmt(total);
    const sub=$r('dIngresoSub');if(sub)sub.textContent=snap.size+' cobro'+(snap.size!==1?'s':'')+' · 💵'+fmt(ef)+' · 🏦'+fmt(tf-ef<0?0:tf);
    const hc=$r('dIngresoHoyCard');if(hc)hc.textContent=fmt(total);
    const choy=$r('dCobrosHoy');if(choy)choy.textContent=snap.size;
    // Actualizar panel dashboard cobros de hoy
    const dit=$r('dIngresoTotalHoy');const def=$r('dIngresoEfectivo');const dtr=$r('dIngresoTransf');
    const transfAmt=tf-ef<0?0:tf;
    if(dit)dit.textContent=fmt(total);if(def)def.textContent=fmt(ef);if(dtr)dtr.textContent=fmt(transfAmt);
    const lista=$r('listaCobrosHoy');
    if(lista){
        if(snap.empty){lista.innerHTML='<p style="text-align:center;font-size:.72rem;color:var(--txt2);font-weight:600;padding:.5rem">Sin cobros registrados hoy</p>';}
        else{
            const cobros=[];snap.forEach(d=>cobros.push({id:d.id,...d.data()}));
            cobros.sort((a,b)=>(b.fecha?.toMillis?.()||0)-(a.fecha?.toMillis?.()||0));
            lista.innerHTML=cobros.map(p=>{
                const refTag=p.referencia?`<span style="font-size:.55rem;color:var(--azul);background:#eef3ff;padding:1px 5px;border-radius:5px;margin-left:.3rem">REF: ${p.referencia}</span>`:'';
                const metIcon=p.metodo==='EFECTIVO'?'💵':p.metodo==='TRANSFERENCIA'?'🏦':'💳';
                return`<div style="display:flex;align-items:center;justify-content:space-between;padding:.5rem .75rem;background:#f8fafc;border-radius:9px;border:1px solid var(--border)">
                  <div><p style="font-size:.7rem;font-weight:800;color:var(--txt)">${p.nombre||p.alumnoId}</p>
                  <p style="font-size:.6rem;font-weight:600;color:var(--txt2)">${p.detalle||'—'}${refTag}</p></div>
                  <div style="text-align:right"><p style="font-size:.8rem;font-weight:900;color:#059669">$${(p.monto||0).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2})}</p>
                  <p style="font-size:.6rem;color:var(--txt2)">${metIcon} ${p.metodo||''}</p></div>
                </div>`;
            }).join('');
        }
    }
});

db.collection('reservas').where('estado','==','pre-reserva').onSnapshot(snap=>{
    $r('listaPreRes').innerHTML=snap.empty?'<p style="grid-column:1/-1;text-align:center;font-size:.72rem;color:#94a3b8;font-weight:600;padding:1.5rem">Sin pre-reservas</p>':
    snap.docs.map(d=>{const r=d.data();return`<div style="padding:.8rem;background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px">
        <p style="font-size:.58rem;font-weight:800;color:#d97706;text-transform:uppercase;margin-bottom:.2rem">⏳ Pre-reserva</p>
        <p style="font-weight:900;font-size:.75rem;text-transform:uppercase">${r.alumnoNombre||r.alumnoId}</p>
        <p style="font-size:.65rem;color:var(--azul);font-weight:700;margin-top:1px">${r.claseNombre}</p>
        <button onclick="showView('caja');$r('cajaBusca').value='${r.alumnoId}';buscarAlumnoCaja('${r.alumnoId}')" class="btn btn-azul" style="width:100%;justify-content:center;font-size:.6rem;padding:.4rem;margin-top:.5rem"><i class="fa-solid fa-cash-register"></i>Cobrar</button>
    </div>`;}
    ).join('');
});

// ── REGISTRO ─────────────────────────────────────────────────────
function toggleMatricula(){$r('campoMatricula').style.display=$r('rCondicion').value==='ALUMNO_EXTERNO'?'none':'block';}
function toggleCamposClase(){$r('camposClase').style.display=$r('catTipo').value==='clase'?'flex':'none';}

async function registrarAlumno(){
    const nombre=$r('rNombre').value.trim().toUpperCase();
    const curp=$r('rCurp').value.trim().toUpperCase();
    const nivel=$r('rNivel').value;
    const cond=$r('rCondicion').value;
    const mat=$r('rMatricula')?.value.trim()||'N/A';
    const correo=$r('rCorreo')?.value.trim().toLowerCase()||'';
    const celular=$r('rCelular')?.value.trim()||'';
    if(!nombre){toast('⚠️ Ingresa el nombre completo');return;}
    if(curp.length!==18){$r('rCurpErr').style.display='block';return;}
    $r('rCurpErr').style.display='none';
    const btn=$r('btnRegistrar');btn.textContent='PROCESANDO...';btn.disabled=true;
    try{
        const dup=await db.collection('alumnos').where('curp','==',curp).get();
        if(!dup.empty){alumnoExistente={id:dup.docs[0].id,...dup.docs[0].data()};$r('regForm').style.display='none';$r('regExistente').style.display='block';return;}
        let num=1;
        await db.runTransaction(async tx=>{const ref=db.collection('config').doc('contador_alumnos');const s=await tx.get(ref);num=s.exists?(s.data().ultimo_numero||0)+1:1;tx.set(ref,{ultimo_numero:num},{merge:true});});
        const nuevoID='IBI-GYM'+String(num).padStart(6,'0');
        const pin=String(Math.floor(1000+Math.random()*9000));
        const hoy=new Date();const venc=new Date(hoy);venc.setDate(venc.getDate()+MEMBRESIA_DIAS);
        const vencStr=venc.toISOString().split('T')[0];
        await db.collection('alumnos').doc(nuevoID).set({nombre,curp,nivel,pago:'800',pin,condicion:cond,matricula:mat,correo,celular,fechaRegistro:hoy.toLocaleDateString('es-MX'),vencimiento:vencStr,estatus:'INACTIVO',inscripcionPagada:false,primerAcceso:true,password:pin});
        fetch(URL_GAS,{method:'POST',mode:'no-cors',body:JSON.stringify({accion:'NUEVO_USUARIO',id:nuevoID,nombre,curp,pin,nivel,monto:'800',fecha:hoy.toLocaleDateString('es-MX'),condicion:cond,matricula:mat,vencimiento:vencStr})}).catch(()=>{});
        mostrarCredencialReg(nuevoID,nombre,nivel,pin,vencStr);
        toast('🎉 Alumno registrado: '+nuevoID,5000);
    }catch(e){toast('❌ Error: '+e.message,5000);}
    finally{btn.textContent='Inscribir Alumno';btn.disabled=false;}
}
function mostrarCredencialReg(id,nombre,nivel,pin,vence){
    $r('credPlaceholder').style.display='none';$r('credResultado').style.display='block';
    $r('cpNombre').textContent=nombre;$r('cpNivel').textContent=nivel;$r('cpID').textContent=id;$r('cpPIN').textContent=pin;$r('cpVence').textContent=vence;
    const qr=$r('credQR');qr.innerHTML='';new QRCode(qr,{text:id,width:110,height:110,colorDark:'#1e3a6e'});
    window._credActual={id,nombre,pin,vence};
}
function nuevoRegistro(){
    $r('credPlaceholder').style.display='block';$r('credResultado').style.display='none';
    $r('regForm').style.display='block';$r('regExistente').style.display='none';
    ['rNombre','rCurp','rMatricula','rCorreo','rCelular'].forEach(i=>{const el=$r(i);if(el)el.value='';});
}
function mostrarCredencialExistente(){
    if(!alumnoExistente)return;const a=alumnoExistente;
    $r('cexNombre').textContent=a.nombre;$r('cexID').textContent=a.id;$r('cexPIN').textContent=a.pin;$r('cexVence').textContent=a.vencimiento||'N/A';
    const qr=$r('ceQR');qr.innerHTML='';new QRCode(qr,{text:a.id,width:90,height:90,colorDark:'#1e3a6e'});
    $r('modalCredExist').style.display='flex';
}
async function buscarPorCurp(){
    const curp=$r('rCurpBusca').value.trim().toUpperCase();
    if(curp.length<10){toast('⚠️ CURP inválida');return;}
    const btn=$r('btnBuscar');btn.textContent='BUSCANDO...';btn.disabled=true;
    try{
        const snap=await db.collection('alumnos').where('curp','==',curp).get();
        if(snap.empty){toast('❌ No encontrado');return;}
        const d=snap.docs[0];alumnoExistente={id:d.id,...d.data()};mostrarCredencialExistente();
    }catch{toast('❌ Error');}
    finally{btn.textContent='Buscar';btn.disabled=false;}
}
function descargarCredencial(){html2canvas($r('credPreview'),{scale:3,useCORS:true}).then(c=>{const a=document.createElement('a');a.download='IBIME_'+window._credActual?.nombre+'.png';a.href=c.toDataURL();a.click();});}
function enviarWhatsApp(){const c=window._credActual||{};const m=`*IBIME GYMNASTICS CLUB*\nBienvenido!\nID: *${c.id}*\nPIN: *${c.pin}*\nVence: ${c.vence}`;window.open('https://wa.me/?text='+encodeURIComponent(m),'_blank');}

// ── CAJA ─────────────────────────────────────────────────────────
let alumnoEnCaja=null;
async function buscarAlumnoCaja(id){
    const idU=String(id||'').trim().toUpperCase();if(!idU)return;
    try{
        const snap=await db.collection('alumnos').doc(idU).get();
        if(!snap.exists){toast('❌ Alumno no encontrado');return;}
        alumnoEnCaja={id:idU,...snap.data()};
        $r('cajaSinAlumno').style.display='none';$r('cajaConAlumno').style.display='block';
        $r('cajaNombreLetra').textContent=alumnoEnCaja.nombre?.charAt(0)||'?';
        $r('cajaNombre').textContent=alumnoEnCaja.nombre||'';$r('cajaIDAlumno').textContent=idU;
        const vf=alumnoEnCaja.vencimiento?new Date(alumnoEnCaja.vencimiento):new Date(0);
        const dias=Math.ceil((vf-new Date())/86400000);
        const vEl=$r('cajaVence');vEl.textContent=dias>0?`Membresía activa — ${dias} días`:'⚠️ Membresía vencida';
        vEl.style.color=dias>0?'#059669':'#dc2626';
        const rtSnap=await rtdb.ref('estatus_acceso/'+idU).get();const orden=rtSnap.val();
        let folio='',monto='',detalle='';
        if(orden&&orden.monto){folio=orden.folio||'';monto=orden.monto;detalle=orden.detalle||'';}
        let numFolio=1;
        if(!folio){await db.runTransaction(async tx=>{const ref=db.collection('config').doc('contador_pagos');const s=await tx.get(ref);numFolio=s.exists?(s.data().ultimo_numero||0)+1:1;tx.set(ref,{ultimo_numero:numFolio},{merge:true});});folio='IBY-PAG-'+String(numFolio).padStart(10,'0');}
        $r('cajaFolio').textContent=folio;$r('cajaMonto').value=monto||'';$r('cajaDetalle').value=detalle||'';
        if(scannerActivo)toggleScannerCaja();
    }catch(e){toast('❌ '+e.message);}
}
function resetCaja(){alumnoEnCaja=null;$r('cajaSinAlumno').style.display='block';$r('cajaConAlumno').style.display='none';$r('cajaMonto').value='';$r('cajaDetalle').value='';$r('cajaRefTransf').value='';$r('campoRefTransf').style.display='none';$r('cajaMetodo').value='EFECTIVO';}
async function registrarCobro(){
    if(!alumnoEnCaja)return;
    const btn=$r('btnCobrar');const folio=$r('cajaFolio').textContent;
    const monto=parseFloat($r('cajaMonto').value);const detalle=$r('cajaDetalle').value.toUpperCase();const metodo=$r('cajaMetodo').value;
    if(!monto||monto<=0){toast('⚠️ Ingresa un monto válido');return;}
    btn.textContent='PROCESANDO...';btn.disabled=true;
    try{
        let upd={ultimoPago:new Date().toLocaleDateString('es-MX')};
        const esInsc=detalle.includes('INSCRIPCION')||detalle.includes('INSCRIPCI');
        const esMemb=PALABRAS_MEMBRESIA.some(p=>detalle.includes(p));
        if(esInsc){upd.inscripcionPagada=true;upd.estatus='ACTIVO';}
        if(esMemb){
            upd.estatus='ACTIVO';
            let base=new Date();
            if(alumnoEnCaja.vencimiento){const v=new Date(alumnoEnCaja.vencimiento);if(v>base)base=v;}
            base.setDate(base.getDate()+MEMBRESIA_DIAS);
            upd.vencimiento=base.toISOString().split('T')[0];
        }
        if(!esInsc&&!esMemb)upd.estatus='ACTIVO';
        await db.collection('alumnos').doc(alumnoEnCaja.id).update(upd);
        const referencia=metodo==='TRANSFERENCIA'?($r('cajaRefTransf').value.trim()||'S/REF'):'';
        const pagoData={alumnoId:alumnoEnCaja.id,nombre:alumnoEnCaja.nombre,monto,detalle,folio,fecha:new Date(),fechaString:new Date().toLocaleDateString('es-MX'),metodo};
        if(referencia)pagoData.referencia=referencia;
        await db.collection('pagos').add(pagoData);
        const resSnap=await db.collection('reservas').where('alumnoId','==',alumnoEnCaja.id).where('folio','==',folio).where('estado','==','pre-reserva').get();
        await Promise.all(resSnap.docs.map(d=>db.collection('reservas').doc(d.id).update({estado:'confirmada',alertaMostrada:false,fechaConfirmacion:new Date().toLocaleDateString('es-MX')})));
        fetch(URL_GAS,{method:'POST',mode:'no-cors',body:JSON.stringify({accion:'REGISTRAR_PAGO',id:alumnoEnCaja.id,nombre:alumnoEnCaja.nombre,idCarrito:folio,carrito:detalle,monto,metodo,fecha:new Date().toLocaleString('es-MX')})}).catch(()=>{});
        await rtdb.ref('estatus_acceso/'+alumnoEnCaja.id).remove();
        let msg=esMemb?'✅ MEMBRESÍA RENOVADA':'✅ PAGO REGISTRADO';
        if(resSnap.size>0)msg+=` · ${resSnap.size} clase(s) confirmada(s)`;
        toast(msg,5000);resetCaja();
    }catch(e){toast('❌ '+e.message);}
    finally{btn.textContent='Confirmar Pago';btn.disabled=false;}
}
function toggleRefTransf(){
    const m=$r('cajaMetodo').value;
    $r('campoRefTransf').style.display=m==='TRANSFERENCIA'?'block':'none';
    if(m!=='TRANSFERENCIA')$r('cajaRefTransf').value='';
}

function toggleScannerCaja(){
    const btn=$r('btnScanCaja');
    if(!scannerActivo){
        scannerCaja=new Html5Qrcode('cajaScanner');
        scannerCaja.start({facingMode:'environment'},{fps:10,qrbox:180},txt=>{const id=txt.split('|')[0];buscarAlumnoCaja(id);}).catch(e=>toast('❌ Cámara: '+e));
        scannerActivo=true;btn.innerHTML='<i class="fa-solid fa-stop"></i>';
    }else{scannerCaja?.stop().catch(()=>{});scannerActivo=false;btn.innerHTML='<i class="fa-solid fa-qrcode"></i>';}
}

// ── CATÁLOGO ─────────────────────────────────────────────────────
async function publicarItem(){
    const tipo=$r('catTipo').value;
    const payload={nombre:$r('catNombre').value.trim().toUpperCase(),precio:parseFloat($r('catPrecio').value)||0,icon:$r('catIcon').value||'📦',tipo};
    if(!payload.nombre){toast('⚠️ Ingresa un nombre');return;}
    if(tipo==='clase'){payload.inicio=$r('catInicio').value;payload.fin=$r('catFin').value;const cupo=parseInt($r('catCupo').value)||30;payload.cupo=cupo;payload.cupoDisponible=cupo;}
    try{await db.collection('catalogo').add(payload);toast('✅ Publicado en catálogo');['catNombre','catPrecio','catIcon'].forEach(i=>$r(i).value='');}
    catch(e){toast('❌ '+e.message);}
}
db.collection('catalogo').onSnapshot(snap=>{
    $r('gridCatalogo').innerHTML=snap.empty?'<p style="text-align:center;font-size:.72rem;color:#94a3b8;font-weight:600;padding:2rem">Catálogo vacío</p>':
    snap.docs.map(d=>{const i=d.data();return`<div style="display:flex;justify-content:space-between;align-items:center;padding:.7rem .9rem;background:#f8fafc;border:1px solid var(--border);border-radius:10px">
        <div style="display:flex;align-items:center;gap:.7rem">
            <span style="font-size:1.3rem">${i.icon||'📦'}</span>
            <div><p style="font-weight:800;font-size:.75rem;text-transform:uppercase">${i.nombre}</p>
            <p style="font-size:.6rem;color:var(--azul);font-weight:700">$${i.precio}${i.tipo==='clase'?' · '+i.inicio+'-'+i.fin+' · '+(i.cupoDisponible??i.cupo??0)+' lugares':''}</p></div>
        </div>
        <button onclick="db.collection('catalogo').doc('${d.id}').delete()" style="color:#94a3b8;border:none;background:none;cursor:pointer;padding:.3rem" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#94a3b8'"><i class="fa-solid fa-trash-can"></i></button>
    </div>`;}
    ).join('');
});

// ── ALUMNOS ───────────────────────────────────────────────────────
let alumnosFiltrados=[];
async function cargarAlumnos(){
    const snap=await db.collection('alumnos').orderBy('nombre').get();
    alumnosCached=snap.docs.map(d=>{return{id:d.id,...d.data()}});
    alumnosFiltrados=[...alumnosCached];renderListaAlumnos();
}
function filtrarAlumnos(){
    const q=$r('buscarAlumnoInput').value.toLowerCase();
    alumnosFiltrados=alumnosCached.filter(a=>(a.nombre||'').toLowerCase().includes(q)||a.id.toLowerCase().includes(q));
    renderListaAlumnos();
}
function renderListaAlumnos(){
    const l=$r('listaAlumnos');const hoy=new Date();
    l.innerHTML=alumnosFiltrados.length===0?'<p style="text-align:center;font-size:.7rem;color:#94a3b8;font-weight:600;padding:1rem">Sin resultados</p>':
    alumnosFiltrados.map(a=>{
        const vf=a.vencimiento?new Date(a.vencimiento):new Date(0);const dias=Math.ceil((vf-hoy)/86400000);
        const col=dias>7?'#10b981':dias>0?'#f59e0b':'#ef4444';
        return`<div onclick="seleccionarAlumno('${a.id}')" style="padding:.6rem .8rem;border-radius:10px;border-left:3px solid ${col};background:${alumnoActualID===a.id?'#eef3ff':'#f8fafc'};cursor:pointer;border-top:1px solid var(--border);border-right:1px solid var(--border);border-bottom:1px solid var(--border);transition:all .2s" onmouseover="this.style.background='#eef3ff'" onmouseout="this.style.background='${alumnoActualID===a.id?'#eef3ff':'#f8fafc'}'">
            <p style="font-weight:800;font-size:.75rem;text-transform:uppercase;line-height:1.2">${a.nombre}</p>
            <p style="font-size:.6rem;color:var(--azul);font-family:monospace;font-weight:700">${a.id}</p>
            <p style="font-size:.58rem;color:#94a3b8;font-weight:600">${a.nivel||''} · ${dias>0?dias+' días':'VENCIDO'}</p>
        </div>`;
    }).join('');
}
function seleccionarAlumno(id){
    const a=alumnosCached.find(x=>x.id===id);if(!a)return;
    alumnoActualID=id;
    $r('alumnoSinSel').style.display='none';$r('alumnoDetalle').style.display='block';
    $r('alumnoAvatar').textContent=a.nombre?.charAt(0)||'?';
    $r('alumnoNombreTit').textContent=a.nombre||'';$r('alumnoIDTit').textContent=id;
    $r('alumnoNivelTit').textContent=(a.nivel||'')+' · '+(a.estatus||'');
    $r('eNombre').value=a.nombre||'';$r('eCurp').value=a.curp||'';$r('eNivel').value=a.nivel||'Fitness';
    $r('eVencimiento').value=a.vencimiento||'';$r('eEstatus').value=a.estatus||'ACTIVO';
    $r('ePin').value=a.pin||'';$r('eCorreo').value=a.correo||'';$r('eCelular').value=a.celular||'';
    const fm=a.fichaMedica||{};
    $r('mSangre').value=fm.sangre||'';$r('mAlergias').value=fm.alergias||'';
    $r('mEmergencia').value=fm.emergencia||'';$r('mLesiones').value=fm.lesiones||'';
    renderListaAlumnos();
}
function switchAlumnoTab(tab){
    ['datos','medica','clases'].forEach(t=>{
        const el=$r(('tab'+t.charAt(0).toUpperCase()+t.slice(1)));
        if(el)el.style.display=t===tab?'grid':'none';
        const btn=$r('at'+t.charAt(0).toUpperCase()+t.slice(1));
        if(btn)btn.classList.toggle('on',t===tab);
    });
    if(tab==='medica')$r('tabMedica').style.display='flex';
    if(tab==='clases')cargarClasesDeAlumno(alumnoActualID);
}
async function guardarAlumno(){
    if(!alumnoActualID){toast('⚠️ Selecciona un alumno');return;}
    const datos={
        nombre:$r('eNombre').value.trim().toUpperCase(),curp:$r('eCurp').value.trim().toUpperCase(),
        nivel:$r('eNivel').value,vencimiento:$r('eVencimiento').value,estatus:$r('eEstatus').value,
        pin:$r('ePin').value,correo:$r('eCorreo').value.trim().toLowerCase(),celular:$r('eCelular').value.trim(),
        fichaMedica:{sangre:$r('mSangre').value.toUpperCase(),alergias:$r('mAlergias').value,emergencia:$r('mEmergencia').value,lesiones:$r('mLesiones').value}
    };
    try{
        await db.collection('alumnos').doc(alumnoActualID).update(datos);
        const idx=alumnosCached.findIndex(a=>a.id===alumnoActualID);
        if(idx>-1)alumnosCached[idx]={...alumnosCached[idx],...datos};
        toast('✅ Alumno actualizado');renderListaAlumnos();
    }catch(e){toast('❌ '+e.message);}
}
async function cargarClasesDeAlumno(id){
    if(!id)return;
    const snap=await db.collection('reservas').where('alumnoId','==',id).get();
    const res=snap.docs.map(d=>d.data());
    const el=$r('alumnoClasesList');
    if(!res.length){el.innerHTML='<p style="font-size:.75rem;color:#94a3b8;font-weight:600;text-align:center;padding:1.5rem">Sin clases inscritas</p>';return;}
    const porEstado={confirmada:res.filter(r=>r.estado==='confirmada'),prereserva:res.filter(r=>r.estado==='pre-reserva')};
    el.innerHTML=(porEstado.confirmada.length?'<p style="font-size:.6rem;font-weight:800;text-transform:uppercase;color:#059669;margin-bottom:.4rem">✅ Confirmadas</p>'+porEstado.confirmada.map(r=>`<div class="alumno-clases-card"><p style="font-weight:800;font-size:.8rem;text-transform:uppercase">${r.claseNombre}</p><span style="font-size:.6rem;color:#64748b;font-weight:600">${r.area||''}</span></div>`).join(''):'')
    +(porEstado.prereserva.length?'<p style="font-size:.6rem;font-weight:800;text-transform:uppercase;color:#d97706;margin:.8rem 0 .4rem">⏳ Pre-reservas</p>'+porEstado.prereserva.map(r=>`<div class="alumno-clases-card"><p style="font-weight:800;font-size:.8rem;text-transform:uppercase">${r.claseNombre}</p><span style="font-size:.6rem;color:#64748b;font-weight:600">${r.area||''}</span></div>`).join(''):'');
}

// ── CLASES ADMIN ─────────────────────────────────────────────────
db.collection('catalogo').where('tipo','==','clase').onSnapshot(snap=>{
    clasesCached=snap.docs.map(d=>{return{id:d.id,...d.data()}});
    actualizarStatsClases();
    renderGridDiscip();
    renderListaClasesEditar();
});

function actualizarStatsClases(){
    $r('cadTotal').textContent=clasesCached.length;
    $r('cadFitness').textContent=clasesCached.filter(c=>c.area==='fitness').length;
    $r('cadGimnasia').textContent=clasesCached.filter(c=>c.area==='gimnasia').length;
    // Count disciplinas with at least 1 reserva
    db.collection('reservas').where('estado','==','confirmada').get().then(snap=>{
        const discips=new Set(snap.docs.map(d=>d.data().claseNombre));
        $r('cadConAlumnos').textContent=discips.size;
    }).catch(()=>{$r('cadConAlumnos').textContent='—';});
}

function filtrarArea(area){
    areaFiltro=area;
    ['todo','fitness','gimnasia'].forEach(a=>{
        const b=$r('fa-'+a);if(!b)return;
        if(a===area){b.className='btn btn-azul';b.style.color='';}
        else{b.className='btn btn-ghost';b.style.color=a==='fitness'?'var(--rojo)':a==='gimnasia'?'var(--azul)':'';}
    });
    renderGridDiscip();
}

function switchVistaClases(v){} // Legacy - kept for compatibility
function switchPanel(p){
    ['inscritos','mover','editar'].forEach(k=>{
        $r('spanel-'+k).style.display=k===p?'block':'none';
        const btn=$r('pbtn-'+k);if(btn)btn.classList.toggle('on',k===p);
    });
    if(p==='mover')renderMoverList();
    if(p==='editar')rellenarEditarPanel();
}
function rellenarEditarPanel(){
    if(!claseViendoID)return;
    const clase=clasesCached.find(c=>c.id===claseViendoID);if(!clase)return;
    claseActualID=claseViendoID;
    $r('ceNombre').value=clase.nombre||'';
    $r('ceArea').value=clase.area||'fitness';
    $r('ceIcono').value=clase.icon||'🏋️';
    $r('ceInicio').value=clase.inicio||'';
    $r('ceFin').value=clase.fin||'';
    $r('cePrecio').value=clase.precio||'';
    $r('ceCupo').value=clase.cupo||'';
    document.querySelectorAll('.dia-chk').forEach(cb=>{
        cb.checked=(clase.diasSemana||[]).includes(cb.value);
    });
}
function cerrarPanel(){
    $r('panelVacio').style.display='block';
    $r('panelContenido').style.display='none';
    claseViendoID=null;
    renderGridDiscip();
}
function filtrarClaseInput(){
    const q=$r('buscarClaseInput').value.toLowerCase();
    document.querySelectorAll('#gridDiscip .discip-card').forEach(el=>{
        el.style.display=(el.dataset.nombre||'').toLowerCase().includes(q)?'block':'none';
    });
}

function renderGridDiscip(){
    // Agrupar clases por nombre (disciplina)
    let clases=areaFiltro==='todo'?clasesCached:clasesCached.filter(c=>c.area===areaFiltro);
    const grupos={};
    clases.forEach(c=>{
        const k=c.nombre;
        if(!grupos[k])grupos[k]={nombre:k,icon:c.icon||'🏋️',area:c.area||'',horarios:[]};
        grupos[k].horarios.push(c);
    });
    const g=$r('gridDiscip');
    if(!Object.keys(grupos).length){g.innerHTML='<p style="grid-column:1/-1;text-align:center;font-size:.8rem;color:#94a3b8;font-weight:600;padding:2rem">Sin clases en esta área</p>';return;}
    g.innerHTML=Object.values(grupos).sort((a,b)=>a.nombre.localeCompare(b.nombre)).map(gr=>{
        const total=gr.horarios.reduce((s,h)=>s+(h.cupo||0),0);
        const disp=gr.horarios.reduce((s,h)=>s+(h.cupoDisponible??h.cupo??0),0);
        const ocupados=total-disp;
        const pct=total>0?Math.round((ocupados/total)*100):0;
        const col=gr.area==='fitness'?'var(--rojo)':'var(--azul)';
        const isSel=claseViendoID&&gr.horarios.some(h=>h.id===claseViendoID);
        return`<div class="discip-card ${isSel?'sel':''} ${gr.area}" data-nombre="${gr.nombre.toLowerCase()}" onclick="verDiscip('${gr.horarios[0].id}','${gr.nombre}')">
          <div class="dc-badge"><span style="font-size:.58rem;font-weight:800;padding:2px 7px;border-radius:99px;background:${gr.area==='fitness'?'#fff2f1':'#eef3ff'};color:${col}">${gr.area}</span></div>
          <span class="dc-icon">${gr.icon}</span>
          <p class="dc-name">${gr.nombre}</p>
          <p class="dc-sub">${gr.horarios.length} horario${gr.horarios.length>1?'s':''} · ${disp} lugares libres</p>
          <div class="dc-ocupacion"><div class="dc-ocupacion-fill" style="width:${pct}%;background:${pct>80?'#ef4444':pct>50?'#f59e0b':col}"></div></div>
          <p style="font-size:.58rem;font-weight:700;color:#94a3b8;margin-top:.3rem">${ocupados}/${total} lugares usados</p>
        </div>`;
    }).join('');
}

async function verDiscip(claseId,nombre){
    claseViendoID=claseId;
    renderGridDiscip();
    const clase=clasesCached.find(c=>c.id===claseId)||{};
    const esFit=(clase.area||'')=='fitness';
    $r('panelVacio').style.display='none';
    $r('panelContenido').style.display='block';
    $r('pNombre').textContent=nombre;
    $r('pIcon').textContent=clase.icon||'🏋️';
    $r('pIcon').style.background=esFit?'#fff2f1':'#eef3ff';
    switchPanel('inscritos');
    $r('pSub').textContent=(clase.area||'').toUpperCase()+' · '+(clase.diasSemana||[]).join(', ')+' · '+( clase.inicio||'--')+' – '+(clase.fin||'--');
    // Barra ocupación — agrupar todos los horarios de esta disciplina
    const grHors=clasesCached.filter(x=>x.nombre===nombre);
    const totalC=grHors.reduce((s,h)=>s+(h.cupo||0),0);
    const dispC=grHors.reduce((s,h)=>s+(h.cupoDisponible??h.cupo??0),0);
    const ocupC=totalC-dispC;const pctC=totalC>0?Math.round((ocupC/totalC)*100):0;
    const barColor=pctC>80?'#ef4444':pctC>50?'#f59e0b':(esFit?'var(--rojo)':'var(--azul)');
    $r('pOcupBar').style.width=pctC+'%';$r('pOcupBar').style.background=barColor;
    $r('pOcupTxt').textContent=ocupC+'/'+totalC+' lugares usados';
    await cargarInscritosDiscip(claseId);
    // Scroll to panel
    $r('panelDetalle').scrollIntoView({behavior:'smooth',block:'start'});
}

function cerrarPanelDiscip(){$r('panelContenido').style.display='none';claseViendoID=null;renderGridDiscip();}

function abrirEditar(id){
    switchVistaClases('editar');
    if(id)seleccionarClaseEditar(id);
}

function switchSubTab(tab){switchPanel(tab);} function _legacySwitchSubTab_unused(tab){
    $r('spanel-inscritos').style.display=tab==='inscritos'?'block':'none';
    $r('spanel-mover').style.display=tab==='mover'?'block':'none';
    $r('pbtn-inscritos').classList.toggle('on',tab==='inscritos');
    $r('pbtn-mover').classList.toggle('on',tab==='mover');
    if(tab==='mover')renderListaMoverDiscip();
}

async function cargarInscritosDiscip(claseId){
    const snap=await db.collection('reservas').where('claseId','==',claseId).where('estado','==','confirmada').get();
    const inscritos=snap.docs.map(d=>{return{rid:d.id,...d.data()}});
    $r('listaInscritosDiscip').innerHTML=inscritos.length===0?'<p style="text-align:center;font-size:.72rem;color:#94a3b8;font-weight:600;padding:1.5rem">Sin alumnos confirmados</p>':
    inscritos.map(r=>`<div class="alumno-en-clase">
        <div style="display:flex;align-items:center;gap:.7rem">
          <div class="ac-avatar">${r.alumnoNombre?.charAt(0)||'?'}</div>
          <div class="ac-info"><p>${r.alumnoNombre||r.alumnoId}</p><span>${r.alumnoId}</span></div>
        </div>
        <div style="display:flex;gap:.4rem">
          <button onclick="iniciarMover('${r.alumnoId}','${r.alumnoNombre||r.alumnoId}','${r.rid}')" class="btn btn-ghost" style="font-size:.6rem;padding:.35rem .6rem;color:#7c3aed"><i class="fa-solid fa-right-left"></i></button>
          <button onclick="quitarDeClase('${r.rid}','${claseViendoID}')" class="btn btn-ghost" style="font-size:.6rem;padding:.35rem .6rem;color:#ef4444"><i class="fa-solid fa-user-minus"></i></button>
          <button onclick="showView('alumnos');seleccionarAlumno('${r.alumnoId}')" class="btn btn-ghost" style="font-size:.6rem;padding:.35rem .6rem"><i class="fa-solid fa-user"></i></button>
        </div>
    </div>`).join('');
    // También guardar para mover
    window._inscritosActuales=inscritos;
}

function renderListaMoverDiscip(){
    const ins=window._inscritosActuales||[];
    $r('listaMoverDiscip').innerHTML=ins.length===0?'<p style="text-align:center;font-size:.72rem;color:#94a3b8;font-weight:600;padding:1rem">Sin alumnos</p>':
    ins.map(r=>`<div onclick="iniciarMover('${r.alumnoId}','${r.alumnoNombre||r.alumnoId}','${r.rid}')" class="alumno-en-clase" style="cursor:pointer">
        <div style="display:flex;align-items:center;gap:.7rem">
          <div class="ac-avatar">${r.alumnoNombre?.charAt(0)||'?'}</div>
          <div class="ac-info"><p>${r.alumnoNombre||r.alumnoId}</p><span>Click para seleccionar y mover</span></div>
        </div>
        <i class="fa-solid fa-chevron-right" style="color:#94a3b8;font-size:.7rem"></i>
    </div>`).join('');
}

function iniciarMover(alumnoId,nombre,reservaId){
    alumnoMoverID=alumnoId;alumnoMoverReservaID=reservaId;
    $r('moverAlumnoNombre').textContent=nombre;
    // Poblar select
    const sel=$r('selectDestino');
    sel.innerHTML='<option value="">— Selecciona clase destino —</option>'+
        clasesCached.filter(c=>c.id!==claseViendoID).map(c=>`<option value="${c.id}">${c.nombre} (${c.inicio||'--'}–${c.fin||'--'}) · ${c.cupoDisponible??0} lugares</option>`).join('');
    $r('moverForm').style.display='block';
    switchSubTab('mover');
}
function cancelarMover(){alumnoMoverID=null;alumnoMoverReservaID=null;$r('moverForm').style.display='none';}

async function ejecutarMover(){
    const destId=$r('selectDestino').value;
    if(!destId||!alumnoMoverID||!alumnoMoverReservaID){toast('⚠️ Selecciona la clase destino');return;}
    const dest=clasesCached.find(c=>c.id===destId);
    if(!dest){toast('❌ Clase no encontrada');return;}
    if((dest.cupoDisponible??dest.cupo??0)<=0){toast('🔴 Sin lugares en clase destino');return;}
    try{
        const batch=db.batch();
        batch.update(db.collection('catalogo').doc(claseViendoID),{cupoDisponible:firebase.firestore.FieldValue.increment(1)});
        batch.delete(db.collection('reservas').doc(alumnoMoverReservaID));
        const nr=db.collection('reservas').doc();
        batch.set(nr,{alumnoId:alumnoMoverID,alumnoNombre:$r('moverAlumnoNombre').textContent,claseId:destId,claseNombre:dest.nombre,area:dest.area||'',estado:'confirmada',alertaMostrada:true,timestamp:Date.now()});
        batch.update(db.collection('catalogo').doc(destId),{cupoDisponible:firebase.firestore.FieldValue.increment(-1)});
        await batch.commit();
        toast('🔄 Movido a '+dest.nombre,4000);cancelarMover();
        await cargarInscritosDiscip(claseViendoID);
    }catch(e){toast('❌ '+e.message);}
}

async function quitarDeClase(reservaId,claseId){
    if(!confirm('¿Quitar al alumno de esta clase?'))return;
    try{
        await db.collection('catalogo').doc(claseId).update({cupoDisponible:firebase.firestore.FieldValue.increment(1)});
        await db.collection('reservas').doc(reservaId).delete();
        toast('🗑️ Alumno removido');await cargarInscritosDiscip(claseId);
    }catch(e){toast('❌ '+e.message);}
}

// Vista Por Alumno
async function buscarAlumnoEnClases(){
    const q=$r('buscarAlumnoClases').value.trim().toLowerCase();
    if(q.length<2){$r('resultadoAlumnoClases').innerHTML='';return;}
    const resultados=alumnosCached.filter(a=>(a.nombre||'').toLowerCase().includes(q)||a.id.toLowerCase().includes(q));
    if(!resultados.length){$r('resultadoAlumnoClases').innerHTML='<p style="font-size:.75rem;color:#94a3b8;font-weight:600">Sin resultados</p>';return;}
    $r('resultadoAlumnoClases').innerHTML='<p style="font-size:.6rem;font-weight:800;text-transform:uppercase;color:#94a3b8;margin-bottom:.6rem">'+resultados.length+' alumnos encontrados — click para ver sus clases</p>'+
    resultados.slice(0,10).map(a=>`<div class="alumno-en-clase" style="margin-bottom:.4rem;cursor:pointer" onclick="expandirAlumnoEnClases('${a.id}','${a.nombre}',this)">
        <div style="display:flex;align-items:center;gap:.7rem">
          <div class="ac-avatar">${a.nombre?.charAt(0)||'?'}</div>
          <div class="ac-info"><p>${a.nombre}</p><span>${a.id}</span></div>
        </div>
        <i class="fa-solid fa-chevron-down" style="color:#94a3b8;font-size:.75rem"></i>
    </div><div id="aclases-${a.id}" style="display:none;padding:.5rem .5rem .5rem 3rem"></div>`).join('');
}

async function expandirAlumnoEnClases(id,nombre,row){
    const panel=$r('aclases-'+id);
    if(panel.style.display==='block'){panel.style.display='none';return;}
    panel.style.display='block';
    panel.innerHTML='<p style="font-size:.65rem;color:#94a3b8">Cargando...</p>';
    const snap=await db.collection('reservas').where('alumnoId','==',id).get();
    const res=snap.docs.map(d=>d.data());
    if(!res.length){panel.innerHTML='<p style="font-size:.7rem;color:#94a3b8;font-weight:600;padding:.5rem 0">Sin clases inscritas</p>';return;}
    panel.innerHTML=res.map(r=>`<span class="ac-clase-pill" style="background:${r.estado==='confirmada'?'#dcfce7':'#fef9c3'};color:${r.estado==='confirmada'?'#166534':'#92400e'}">${r.claseNombre} ${r.estado==='confirmada'?'✅':'⏳'}</span>`).join('');
}

// Editar clase
function renderListaClasesEditar(){
    let clases=clasesCached;
    $r('listaClasesEditar').innerHTML=clases.length===0?'<p style="font-size:.7rem;color:#94a3b8;font-weight:600;text-align:center;padding:1rem">Sin clases</p>':
    clases.sort((a,b)=>a.nombre.localeCompare(b.nombre)).map(c=>{
        const esFit=c.area==='fitness';
        return`<div onclick="seleccionarClaseEditar('${c.id}')" style="padding:.6rem .8rem;border-radius:10px;border:1.5px solid ${claseActualID===c.id?(esFit?'var(--rojo)':'var(--azul)'):'var(--border)'};background:${claseActualID===c.id?'#f0f4ff':'#f8fafc'};cursor:pointer;margin-bottom:.3rem;transition:all .2s">
            <div style="display:flex;align-items:center;gap:.5rem">
              <span style="font-size:1.1rem">${c.icon||'🏋️'}</span>
              <div>
                <p style="font-weight:800;font-size:.75rem;text-transform:uppercase;line-height:1.2">${c.nombre}</p>
                <p style="font-size:.58rem;color:#94a3b8;font-weight:600">${c.inicio||'--'}–${c.fin||'--'} · ${(c.cupoDisponible??c.cupo??0)} lugares</p>
              </div>
            </div>
        </div>`;
    }).join('');
}

function seleccionarClaseEditar(id){
    const c=clasesCached.find(x=>x.id===id);if(!c)return;
    claseActualID=id;
    $r('editarSinSel').style.display='none';$r('editarForm').style.display='block';
    $r('editarTitulo').textContent=c.icon+' '+c.nombre;
    $r('ceNombre').value=c.nombre||'';$r('ceArea').value=c.area||'fitness';
    $r('ceInicio').value=c.inicio||'';$r('ceFin').value=c.fin||'';
    $r('cePrecio').value=c.precio||0;$r('ceCupo').value=c.cupo||20;
    $r('ceIcono').value=c.icon||'🏋️';
    $r('ceDisponible').textContent=(c.cupoDisponible??c.cupo??0)+' lugares';
    document.querySelectorAll('.dia-chk').forEach(chk=>{chk.checked=(c.diasSemana||[]).includes(chk.value);});
    renderListaClasesEditar();
}

async function guardarClaseEdit(){
    if(!claseActualID){toast('⚠️ Selecciona una clase');return;}
    const dias=Array.from(document.querySelectorAll('.dia-chk:checked')).map(c=>c.value);
    const datos={
        nombre:$r('ceNombre').value.trim().toUpperCase(),area:$r('ceArea').value,
        inicio:$r('ceInicio').value,fin:$r('ceFin').value,
        precio:parseFloat($r('cePrecio').value)||0,cupo:parseInt($r('ceCupo').value)||20,
        icon:$r('ceIcono').value||'🏋️',diasSemana:dias
    };
    if(!datos.nombre){toast('⚠️ El nombre es obligatorio');return;}
    try{await db.collection('catalogo').doc(claseActualID).update(datos);toast('✅ Clase actualizada');}
    catch(e){toast('❌ '+e.message);}
}

async function eliminarClaseEdit(){
    if(!claseActualID)return;
    const clase=clasesCached.find(c=>c.id===claseActualID);
    if(!confirm(`¿Eliminar "${clase?.nombre}"? También se borrarán sus reservas.`))return;
    try{
        const snap=await db.collection('reservas').where('claseId','==',claseActualID).get();
        const batch=db.batch();snap.docs.forEach(d=>batch.delete(d.ref));
        batch.delete(db.collection('catalogo').doc(claseActualID));
        await batch.commit();
        claseActualID=null;$r('editarSinSel').style.display='block';$r('editarForm').style.display='none';
        toast('🗑️ Clase eliminada');
    }catch(e){toast('❌ '+e.message);}
}

// ── INGRESOS HISTÓRICOS ───────────────────────────────────────────
async function cargarIngresosHist(){
    const mesInput=$r('filtroMesIngr').value;
    if(!mesInput){toast('⚠️ Selecciona un mes');return;}
    const [anio,mes]=mesInput.split('-');
    const inicio=new Date(parseInt(anio),parseInt(mes)-1,1);
    const fin=new Date(parseInt(anio),parseInt(mes),1);
    const tabla=$r('tablaIngresos');
    tabla.innerHTML='<p style="font-size:.75rem;color:var(--txt2);font-weight:600;padding:1rem;text-align:center">Cargando...</p>';
    try{
        const snap=await db.collection('pagos')
            .where('fecha','>=',inicio)
            .where('fecha','<',fin)
            .orderBy('fecha','asc').get();
        if(snap.empty){tabla.innerHTML='<p style="font-size:.75rem;color:var(--txt2);font-weight:600;padding:1rem;text-align:center">Sin cobros en este periodo</p>';return;}
        // Agrupar por día
        const dias={};
        let totalMes=0;
        snap.forEach(d=>{
            const p=d.data();
            const dia=p.fechaString||'Sin fecha';
            if(!dias[dia])dias[dia]={cobros:[],total:0,efectivo:0,transf:0,tarjeta:0};
            dias[dia].cobros.push(p);
            dias[dia].total+=(p.monto||0);
            totalMes+=(p.monto||0);
            if(p.metodo==='EFECTIVO')dias[dia].efectivo+=(p.monto||0);
            else if(p.metodo==='TRANSFERENCIA')dias[dia].transf+=(p.monto||0);
            else if(p.metodo==='TARJETA')dias[dia].tarjeta+=(p.monto||0);
        });
        $r('dIngresoMes').textContent='$'+totalMes.toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});
        $r('dCobrosHoy').textContent=snap.size;
        tabla.innerHTML=Object.entries(dias).sort((a,b)=>a[0].localeCompare(b[0])).map(([dia,info])=>`
            <div onclick="verDetalleDia('${dia}')" style="display:grid;grid-template-columns:1fr auto auto auto auto;align-items:center;gap:.75rem;padding:.7rem 1rem;border-radius:10px;border:1px solid var(--border);background:white;cursor:pointer;transition:all .2s" onmouseover="this.style.background='#f0f4ff'" onmouseout="this.style.background='white'">
                <p style="font-weight:800;font-size:.8rem">${dia}</p>
                <span style="font-size:.62rem;font-weight:700;color:#64748b">${info.cobros.length} cobro${info.cobros.length>1?'s':''}</span>
                <span style="font-size:.6rem;font-weight:700;color:#10b981;background:#f0fdf4;padding:2px 7px;border-radius:99px">💵 $${info.efectivo.toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                <span style="font-size:.6rem;font-weight:700;color:var(--azul);background:#eef3ff;padding:2px 7px;border-radius:99px">🏦 $${info.transf.toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                <span style="font-weight:900;font-size:.88rem;color:var(--azul)">$${info.total.toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
            </div>`).join('');
        // Row total
        tabla.innerHTML+=`<div style="display:flex;justify-content:space-between;align-items:center;padding:.7rem 1rem;background:var(--azul);border-radius:10px;margin-top:.4rem">
            <p style="color:white;font-weight:900;font-size:.8rem;text-transform:uppercase">Total del mes</p>
            <p style="color:white;font-weight:900;font-size:1.2rem">$${totalMes.toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2})}</p>
        </div>`;
    }catch(e){tabla.innerHTML='<p style="color:red;font-size:.75rem;padding:1rem">Error: '+e.message+' — verifica índices en Firebase</p>';}
}

let _diaSeleccionado={};
async function verDetalleDia(dia){
    const info=_diaSeleccionado[dia];
    $r('detalleIngreso').style.display='block';
    $r('detalleIngresoTitulo').textContent='Cobros del '+dia;
    // Fetch fresh from Firestore for detail
    db.collection('pagos').where('fechaString','==',dia).orderBy('fecha','asc').get().then(snap=>{
        if(snap.empty){$r('listaDetalleIngreso').innerHTML='<p style="font-size:.75rem;color:var(--txt2);font-weight:600;padding:1rem">Sin cobros</p>';return;}
        let html='';
        snap.forEach(d=>{const p=d.data();
            const refTag=p.referencia?`<span style="font-size:.58rem;color:var(--azul);font-weight:700;background:#eef3ff;padding:1px 6px;border-radius:6px;margin-left:.3rem">REF: ${p.referencia}</span>`:'';
            html+=`<div style="display:flex;justify-content:space-between;align-items:center;padding:.65rem .9rem;background:#f8fafc;border-radius:10px;border:1px solid var(--border)">
                <div>
                    <p style="font-weight:800;font-size:.78rem;text-transform:uppercase">${p.nombre||p.alumnoId}</p>
                    <p style="font-size:.62rem;color:var(--txt2);font-weight:600">${p.detalle||''} · ${p.metodo||''}${refTag}</p>
                </div>
                <p style="font-weight:900;font-size:.95rem;color:var(--azul)">$${(p.monto||0).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2})}</p>
            </div>`;
        });
        $r('listaDetalleIngreso').innerHTML=html;
    }).catch(e=>$r('listaDetalleIngreso').innerHTML='<p style="color:red;font-size:.75rem">Error: '+e.message+'</p>');
}

// Inicializar filtro de mes al cargar

} // end initRecepcion

window.addEventListener('DOMContentLoaded',()=>{ // REC_INIT
    const hoy=new Date();
    const mesActual=hoy.getFullYear()+'-'+String(hoy.getMonth()+1).padStart(2,'0');
    const fi=$r('filtroMesIngr');if(fi)fi.value=mesActual;
    setInterval(()=>{const _r=$r('reloj');if(_r)_r.textContent=new Date().toLocaleTimeString('es-MX');},1000);
});


// ── EXPONER FUNCIONES GLOBALES (onclick en HTML) ──
    if (typeof buscarAlumnoCaja === 'function') window.buscarAlumnoCaja = buscarAlumnoCaja;
    if (typeof buscarPorCurp === 'function') window.buscarPorCurp = buscarPorCurp;
    if (typeof cargarIngresosHist === 'function') window.cargarIngresosHist = cargarIngresosHist;
    if (typeof descargarCredencial === 'function') window.descargarCredencial = descargarCredencial;
    if (typeof enviarWhatsApp === 'function') window.enviarWhatsApp = enviarWhatsApp;
    if (typeof filtrarAlumnos === 'function') window.filtrarAlumnos = filtrarAlumnos;
    if (typeof guardarAlumno === 'function') window.guardarAlumno = guardarAlumno;
    if (typeof mostrarCredencialExistente === 'function') window.mostrarCredencialExistente = mostrarCredencialExistente;
    if (typeof nuevoRegistro === 'function') window.nuevoRegistro = nuevoRegistro;
    if (typeof publicarItem === 'function') window.publicarItem = publicarItem;
    if (typeof registrarAlumno === 'function') window.registrarAlumno = registrarAlumno;
    if (typeof registrarCobro === 'function') window.registrarCobro = registrarCobro;
    if (typeof resetCaja === 'function') window.resetCaja = resetCaja;
    if (typeof showView === 'function') window.showView = showView;
    if (typeof switchAlumnoTab === 'function') window.switchAlumnoTab = switchAlumnoTab;
    if (typeof toggleCamposClase === 'function') window.toggleCamposClase = toggleCamposClase;
    if (typeof toggleMatricula === 'function') window.toggleMatricula = toggleMatricula;
    if (typeof toggleRefTransf === 'function') window.toggleRefTransf = toggleRefTransf;
    if (typeof toggleScannerCaja === 'function') window.toggleScannerCaja = toggleScannerCaja;
    if (typeof verDetalleDia === 'function') window.verDetalleDia = verDetalleDia;
