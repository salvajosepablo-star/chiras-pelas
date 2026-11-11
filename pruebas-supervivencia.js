// Pruebas de la Batalla de Supervivencia. Se abren con index.html#prueba-super-reglas
(function(){
const S = window.ChirasSupervivencia, N = window.ChirasNucleo;
let ok = 0, mal = 0;
const check = (n, c, d) => { c ? ok++ : mal++; console.log(`[test] ${c ? 'PASA ' : 'FALLA'} ${n}${d ? ' — ' + d : ''}`); };
const correr = seg => { for (let i = 0; i < Math.round(seg * 60); i++) S.paso(1 / 60); };
function nueva(humanos, bots){
  S.iniciar({humanos, bots: bots || 0, sinCuenta: true, nombres: ['Ana', 'Beto']});
  S.fuente.activa = false; S.fuente.grupo.visible = false; S.fuente.espera = 999;
  const js = S.jugadores(); js.forEach(j => { j.ia = false; });
  return js;
}
function poner(j, x, z, vx, vz, h){ j.p.set(x, 0, z); j.v.set(vx || 0, 0, vz || 0); j.h = h === undefined ? 0 : h; j.input = {x: 0, z: 0}; }
const C = S.CFG.arena;
let a, b, c;
try {
// ---- 1. Conducción con joystick
[a, b] = nueva(2); poner(a, C.x, C.z + 10); poner(b, C.x + 8, C.z);
a.input.z = -1; correr(1);
check('Joystick adelante: la canica acelera y avanza', C.z + 10 - a.p.z > 2 && Math.hypot(a.v.x, a.v.z) > 3, `avanzó ${(C.z + 10 - a.p.z).toFixed(1)} m a ${Math.hypot(a.v.x, a.v.z).toFixed(1)} m/s`);
const x0 = a.p.x; a.input = {x: 1, z: 0}; let huboDerrape = false;
for (let i = 0; i < 90; i++){ S.paso(1 / 60); huboDerrape = huboDerrape || a.derrape; }
check('Joystick a la derecha: gira y se va a la derecha', a.p.x - x0 > 1, `se movió ${(a.p.x - x0).toFixed(1)} m a la derecha`);
check('Giro brusco a toda velocidad: derrapa', huboDerrape);
poner(a, C.x - 5, C.z, 0, -6); poner(b, C.x + 5, C.z, 0, -6);
a.input.frenoBoton = true; correr(0.5);
const va = Math.hypot(a.v.x, a.v.z), vb = Math.hypot(b.v.x, b.v.z);
check('Freno: frena mucho más que soltando el joystick', va < vb * 0.4, `${va.toFixed(1)} vs ${vb.toFixed(1)} m/s`);
a.input.frenoBoton = false;
poner(a, C.x, C.z + 12); a.input = {x: 0, z: -1, turbo: true}; correr(1.2);
const vt = Math.hypot(a.v.x, a.v.z);
check('Turbo: pasa la velocidad máxima normal', vt > S.CFG.vmax + 1, `${vt.toFixed(1)} m/s (normal ${S.CFG.vmax})`);
check('Turbo: queda recargando y no se repite seguido', a.recarga > 0 && (correr(0.5), a.turbo <= 0));
a.input = {x: 1, z: 0}; correr(10);
check('El borde de la arena no la deja salir', Math.hypot(a.p.x - C.x, a.p.z - C.z) <= C.radio);
// joystick táctil de verdad (toques en la pantalla)
[a, b] = nueva(2);
const cv = document.querySelector('#app canvas'), H = innerHeight;
const tocar = (tipo, id, x, y) => cv.dispatchEvent(new PointerEvent(tipo, {bubbles: true, pointerId: id, clientX: x, clientY: y}));
tocar('pointerdown', 1, 200, H * 0.8); tocar('pointermove', 1, 260, H * 0.8);
check('Joystick táctil abajo: maneja al jugador 1 y se ve el joystick', a.input.x > 0.9 && !document.querySelector('#svJoy1').hidden, `x=${a.input.x.toFixed(2)}`);
tocar('pointerdown', 2, 200, H * 0.2); tocar('pointermove', 2, 260, H * 0.2);
check('Joystick táctil arriba: maneja al jugador 2 (al revés, porque está al frente)', b.input.x < -0.9 && a.input.x > 0.9);
tocar('pointerup', 1, 260, H * 0.8); tocar('pointerup', 2, 260, H * 0.2);
check('Al soltar el dedo se suelta el joystick', a.input.x === 0 && b.input.x === 0 && document.querySelector('#svJoy1').hidden);

// ---- 2. Fuente Suprema
[a, b] = nueva(2); poner(a, C.x, C.z + 8); poner(b, C.x + 8, C.z);
check('Todos empiezan pequeños y sin poder', !a.sup && !b.sup && a.r === S.CFG.radioInicial);
S.fuente.espera = 0; S.paso(1 / 60);
check('La Fuente Suprema aparece en la arena', S.fuente.activa && S.fuente.grupo.visible);
const pf = S.fuente.p.clone();
poner(a, pf.x, pf.z); correr(0.1);
check('Al atravesar la Fuente gana el poder', a.sup && !b.sup && !S.fuente.activa);
correr(S.CFG.fuente.reaparece + 0.3);
check('La Fuente vuelve a aparecer para los demás', S.fuente.activa && S.fuente.p.distanceTo(pf) > 0.01);

// ---- 3. Crecimiento
[a, b, c] = nueva(2, 1); a.sup = true;
poner(a, C.x - 1, C.z, 4, 0, Math.PI / 2); poner(b, C.x, C.z); poner(c, C.x + 6, C.z + 6);
const r0 = a.rObj; correr(0.25);
check('Con poder devora a una sin poder', !b.vivo && a.vivo && a.rObj > r0, `radio ${r0.toFixed(2)} → ${a.rObj.toFixed(2)}`);
const rMedio = a.r; correr(2);
check('El crecimiento es animado (va creciendo poco a poco)', rMedio < a.rObj - 0.005 && Math.abs(a.r - a.rObj) < 0.01, `a mitad ${rMedio.toFixed(3)}, final ${a.r.toFixed(3)}`);
const r1 = a.rObj; poner(a, c.p.x - 1.2, c.p.z, 4, 0, Math.PI / 2); correr(0.3);
check('Cada vez que devora crece más', !c.vivo && a.rObj > r1, `${r1.toFixed(2)} → ${a.rObj.toFixed(2)}`);
[a, b] = nueva(2);
poner(a, C.x - 1, C.z, 5, 0, Math.PI / 2); poner(b, C.x, C.z); correr(0.4);
check('Sin poder no se devoran: solo rebotan', a.vivo && b.vivo && b.v.x > 1);

// ---- 4. Choques entre poderosos por velocidad
[a, b] = nueva(2); a.sup = b.sup = true; b.rObj = b.r = 0.6;
poner(a, C.x - 1.5, C.z, 6, 0, Math.PI / 2); poner(b, C.x, C.z);
correr(0.4);
check('Gana la más rápida hacia la otra, aunque sea más pequeña', a.vivo && !b.vivo, 'pequeña a 6 m/s contra grande quieta');
[a, b] = nueva(2); a.sup = b.sup = true;
poner(a, C.x - 1, C.z, 4, 0, Math.PI / 2); poner(b, C.x + 1, C.z, -4, 0, -Math.PI / 2);
correr(0.5);
check('Velocidades parecidas: rebotan y sobreviven las dos', a.vivo && b.vivo && S.registro().some(e => e.tipo === 'empate'));
[a, b] = nueva(2); a.sup = b.sup = true;
poner(a, C.x - 0.6, C.z, 0.8, 0, Math.PI / 2); poner(b, C.x, C.z);
correr(0.8);
check('Choque suave: sobreviven las dos', a.vivo && b.vivo);
[a, b] = nueva(2); a.sup = b.sup = true;
poner(a, C.x - 1.5, C.z, 2, 0, Math.PI / 2); poner(b, C.x + 1.5, C.z, -6, 0, -Math.PI / 2);
correr(0.5);
check('La que embiste más rápido gana aunque la otra también venga', !a.vivo && b.vivo);
const duelo = S.registro().find(e => e.tipo === 'duelo');
check('El duelo queda registrado con las velocidades', duelo && duelo.vGana > duelo.vPierde, duelo ? `${duelo.vGana} vs ${duelo.vPierde} m/s` : '');

// ---- 5. Gana la última
[a, b] = nueva(1, 1); a.sup = true; poner(a, C.x - 1, C.z, 4, 0, Math.PI / 2); poner(b, C.x, C.z);
correr(3);
check('Gana la última canica en la arena', !document.querySelector('#svFin').hidden && /sobrevivió/.test(document.querySelector('#svFinTit').textContent), document.querySelector('#svFinTit').textContent);
} catch (e){ mal++; console.log('[test] FALLA excepción: ' + e.message + ' ' + (e.stack || '').split('\n')[1]); }
console.log(`[test] RESUMEN ${ok} pasan, ${mal} fallan`);
})();
