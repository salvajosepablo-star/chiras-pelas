// Pruebas de la Batalla a la loca. Se abren con index.html#prueba-loca-reglas
(function(){
const B = window.ChirasBatalla, N = window.ChirasNucleo, L = window.ChirasBatallaLoca, S = window.ChirasEspectaculo;
let ok = 0, mal = 0;
const check = (n, c, d) => { c ? ok++ : mal++; console.log(`[test] ${c ? 'PASA ' : 'FALLA'} ${n}${d ? ' — ' + d : ''}`); };
const nueva = () => { B.iniciar({variante: 'loca', nombres: ['Ana', 'Beto'], bots: 1, sinCuenta: true}); const js = B.jugadores(); js[2].quieto = true; return js; };
function poner(j, x, z){ const b = j.bola; Object.assign(b, {enMano: false, enHueco: false, cayendo: false, ignorarHueco: false}); b.p.set(x, N.R, z); b.v.set(0, 0, 0); b.last.copy(b.p); }
const correr = s => { for (let i = 0; i < Math.round(s * 60); i++) B.paso(1 / 60); };
function tirar(j, x, z, extra){ const ang = N.angHacia(j.bola.p, {x, z}), d = Math.hypot(x - j.bola.p.x, z - j.bola.p.z); return B.disparar(j, ang, B.fuerzaDeVel(N.velocidadPara(j.bola.p, ang, d + (extra || 0), false))); }
const ev = t => B.registro().filter(e => e.tipo === t);
let a, b, m;
try {
// ---- sin turnos y el poder
[a, b, m] = nueva(); poner(a, -1, -5); poner(b, 1, -5); poner(m, 8, -30);
check('Sin turnos: los dos tiran al mismo tiempo', tirar(a, -1, -12) && tirar(b, 1, -12));
[a, b, m] = nueva(); poner(a, 0, -16); poner(b, 1.5, -20); poner(m, 8, -30);
tirar(a, 0, -20, 0.05); correr(3); B.colocar(a, {x: -3, z: -25}); tirar(b, 0, -20, 0.05); correr(4);
check('El que enchola tiene el poder (como en el Clásico, pueden tenerlo varios)', a.verdad && b.verdad, ev('hueco').map(e => e.jugador).join(','));
check('No hay turno congelado: nadie queda esperando', B.puedeDisparar(a) || a.bola.enHueco);
// ---- tragar y crecer
[a, b, m] = nueva(); a.verdad = true; poner(a, 0, -5); poner(b, 0, -7); poner(m, 8, -30);
const exp0 = (S ? S.stats.estallidos + S.stats.aplastados : 0);
tirar(a, 0, -7, 2); correr(1);
check('Con el poder, al pegarle se lo traga', !b.vivo && ev('tragada').length === 1 && a.tragadas.length === 1);
check('Se lo traga sin explotarlo', !S || S.stats.estallidos + S.stats.aplastados === exp0);
correr(2);
check('Y crece (se ve y choca más grande)', a.bola.radio > N.R * 1.2 && a.bola.mesh.scale.x > 1.2, `radio x${(a.bola.radio / N.R).toFixed(2)}`);
// ---- la bola grande no se la tragan con un golpe
[a, b, m] = nueva(); b.tragadas = [{nombre: 'X', estilo: 'agua', color: 0}]; b.verdad = true;
a.verdad = true; poner(a, 0, -5); poner(b, 0, -7); poner(m, 8, -30);
tirar(a, 0, -7, 2); correr(3);
check('A una bola grande no se la tragan con un golpe normal', b.vivo && a.vivo);
// ---- quitar el poder
[a, b, m] = nueva(); b.verdad = true; poner(a, 0, -5); poner(b, 0, -7); poner(m, 8, -30);
tirar(a, 0, -7, 2); correr(3);
check('Sin poder, pegarle al que lo tiene se lo quita', !b.verdad && b.vivo);
// ---- cohete
[a, b, m] = nueva(); b.tragadas = [{nombre: 'X', estilo: 'agua', color: 0}, {nombre: 'Y', estilo: 'tigre', color: 0}];
poner(a, 0, -5); poner(b, 4, -14); poner(m, -8, -30);
const sinGrande = (() => { const [x, y, z] = [a, b, m]; const t = y.tragadas; y.tragadas = []; const r = B.activarPoder(x, 'cohete'); y.tragadas = t; return r; })();
check('Cohete: solo se puede si hay una bola grande', !sinGrande.ok, sinGrande.motivo);
let r = B.activarPoder(a, 'cohete');
check('Cohete: la bola se vuelve cohete', r.ok && !!a.cohete && a.mCohete && a.mCohete.visible && !a.bola.mesh.visible);
check('Mientras vuela no puede tirar', !B.puedeDisparar(a));
correr(3);
check('El cohete revienta a la bola grande', !b.vivo && ev('reventado').length === 1 && !a.cohete);
check('…se le caen todas las canicas al suelo, sin vida (nadie se las gana)', ev('reventado')[0].canicas === 2 && L.muertas().length === 2 && a.tragadas.length === 0);
correr(2);
check('Modo depredador', ev('depredador').length === 1);
const muerta = L.muertas()[0], antesP = muerta.p.clone();
// sin poder: pasa por encima y no se la absorbe, ni la mueve
poner(m, muerta.p.x - 3, muerta.p.z); m.verdad = false; m.quieto = true;
tirar(m, muerta.p.x + 3, muerta.p.z); correr(3);
check('Sin el poder no se la absorbe y la canica sin vida no se mueve', L.muertas().length === 2 && muerta.p.distanceTo(antesP) < 1e-9);
// con el poder: se la absorbe y crece
const objM = L.muertas()[0];
poner(a, objM.p.x - 3, objM.p.z); a.verdad = true;
tirar(a, objM.p.x + 1, objM.p.z); correr(3);
check('Con el poder se la absorbe y crece', L.muertas().length <= 1 && a.tragadas.length >= 1 && ev('absorbe').length >= 1);
// La Revancha: el reventado vuelve pagando una canica nueva
const pagoAntes = b.pago;
check('Revancha: el reventado puede volver', L.puedeRevancha(b) && L.revancha(b));
check('…paga una canica, vuelve desde la raya sin poder y sin lo que tenía', b.vivo && b.pago === pagoAntes - 1 && b.bola.enMano && Math.abs(b.bola.p.z - 0.35) < 0.01 && !b.verdad && b.tragadas.length === 0);
// ---- defensas contra el cohete
[a, b, m] = nueva(); b.tragadas = [{nombre: 'X', estilo: 'agua', color: 0}]; poner(a, 0, -5); poner(b, 0, -15); poner(m, -8, -30);
B.activarPoder(b, 'arena'); B.activarPoder(a, 'cohete'); correr(3);
check('Arena movediza se traga el cohete', b.vivo && ev('cohete-fallo').some(e => e.motivo === 'arena'));
[a, b, m] = nueva(); b.tragadas = [{nombre: 'X', estilo: 'agua', color: 0}]; poner(a, 0, -5); poner(b, 0, -15); poner(m, -8, -30);
B.activarPoder(b, 'barrera'); B.activarPoder(a, 'cohete'); correr(3);
check('La barrera para el cohete', b.vivo && ev('cohete-fallo').some(e => e.motivo === 'barrera'));
[a, b, m] = nueva(); b.tragadas = [{nombre: 'X', estilo: 'agua', color: 0}]; poner(a, 0, -5); poner(b, 0, -15); poner(m, -8, -30);
B.activarPoder(b, 'viento'); B.activarPoder(a, 'cohete'); correr(0.5);
check('El viento saca de rumbo al cohete', a.cohete && a.cohete.sinGuia > 0 && Math.abs(a.cohete.dir.x) > 0.2, `rumbo x=${a.cohete ? a.cohete.dir.x.toFixed(2) : '-'}`);
// ---- la bola gigante se para encima del hueco y coge el poder
[a, b, m] = nueva(); b.tragadas = [1, 2, 3].map(i => ({nombre: 'X' + i, estilo: 'agua', color: 0})); correr(0.1);
poner(b, N.HOLE.x, N.HOLE.z + 1.2); poner(a, 6, -5); poner(m, -8, -30);
tirar(b, N.HOLE.x, N.HOLE.z, 0.02); correr(4);
check('La bola gigante no cabe en el hueco: se para encima y coge el poder', b.verdad && !b.bola.enHueco && !b.bola.cayendo, `radio x${(b.bola.radio / N.R).toFixed(2)}`);
// ---- pipear a la grande le quita el poder, no la explota
[a, b, m] = nueva(); b.tragadas = [{nombre: 'X', estilo: 'agua', color: 0}]; b.verdad = true; poner(a, 0, -5); poner(b, 0, -7); poner(m, -8, -30);
tirar(a, 0, -7, 2); correr(3);
check('Pipear a la grande solo le quita el poder (no la explota)', b.vivo && !b.verdad);
// ---- Nada de nada
[a, b, m] = nueva(); poner(a, 0, -5); poner(b, 0, -9); poner(m, -8, -30);
B.activarPoder(a, 'nada');
check('Nada de nada: a todos los demás se les anulan los poderes', !B.activarPoder(b, 'barrera').ok && B.activarPoder(a, 'barrera').ok);
correr(4.2);
check('Nada de nada se acaba solo', B.activarPoder(b, 'arena').ok);
// ---- Boloncho rompe la barrera
[a, b, m] = nueva(); a.verdad = true; poner(a, 0, -4); poner(b, 0, -8); poner(m, -8, -30);
B.activarPoder(b, 'barrera'); B.activarPoder(a, 'boloncho'); correr(0.2);
tirar(a, 0, -8, 2); correr(3);
check('Boloncho rompe la barrera y se lo traga', L.tablas().length === 0 && !b.vivo);
// ---- Ochera y Carambola
[a, b, m] = nueva(); a.verdad = true; poner(a, 0, -19.3); poner(b, 4, -12); poner(m, -8, -30);
B.activarPoder(b, 'ochera');
tirar(a, 0, -20, 0.05); B.alChocar(a.bola, m.bola, 2, 2, 0); correr(3);
check('Ochera muere: le pegó a alguien y se metió al hueco', !a.vivo && ev('eliminado').some(e => e.jugador === 'Ana' && /hueco/.test(e.motivo)));
[a, b, m] = nueva(); poner(a, 0, -5); poner(b, 0, -9); poner(m, 3, -9);
B.activarPoder(b, 'carambola'); tirar(a, 0, -9);
B.alChocar(a.bola, b.bola, 2, 2, 0); B.alChocar(a.bola, m.bola, 2, 2, 0);
check('Carambola muere: le pegó a dos y uno la había cantado', !a.vivo);
// ---- gana el último
[a, b, m] = nueva(); a.verdad = true; m.vivo = false; m.bola.activa = false; poner(a, 0, -5); poner(b, 0, -7);
tirar(a, 0, -7, 2); correr(4);
check('Gana el último que quede', B.estado().fin && B.estado().ganador === 'Ana');
} catch (e){ mal++; console.log('[test] FALLA excepción: ' + e.message + ' ' + (e.stack || '').split('\n')[1]); }
console.log(`[test] RESUMEN ${ok} pasan, ${mal} fallan`);
})();
