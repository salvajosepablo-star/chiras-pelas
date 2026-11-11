// Pruebas automáticas del modo Batalla. Se abren con index.html#prueba-reglas
// y escriben el resultado en la consola del navegador.
(function(){
const B = window.ChirasBatalla, N = window.ChirasNucleo, P = window.ChirasPoderes;
let ok = 0, mal = 0;
const check = (nombre, cond, detalle) => { cond ? ok++ : mal++; console.log(`[test] ${cond ? 'PASA ' : 'FALLA'} ${nombre}${detalle ? ' — ' + detalle : ''}`); };
const nueva = extras => { B.iniciar({contraIA: false, nombres: ['Ana', 'Beto'], extras: !!extras, sinCuenta: true}); return B.jugadores(); };
function poner(j, x, z){ const b = j.bola; Object.assign(b, {enMano: false, enHueco: false, cayendo: false, ignorarHueco: false}); b.p.set(x, N.R, z); b.v.set(0, 0, 0); b.last.copy(b.p); }
const correr = seg => { for (let i = 0; i < Math.round(seg * 60); i++) B.paso(1 / 60); };
function tirar(j, x, z, extra){
  const ang = N.angHacia(j.bola.p, {x, z}), d = Math.hypot(x - j.bola.p.x, z - j.bola.p.z);
  return B.disparar(j, ang, B.fuerzaDeVel(N.velocidadPara(j.bola.p, ang, d + (extra || 0), false)));
}
const tipos = () => B.registro().map(e => e.tipo);
const ev = t => B.registro().filter(e => e.tipo === t);
const f2 = v => v.toFixed(2);
let a, b, r;

try {
// 1. Sin turnos
[a, b] = nueva();
const t1 = B.disparar(a, 0, 0.5), t2 = B.disparar(b, 0.1, 0.5);
correr(0.3);
check('Los dos lanzan la salida en el mismo instante', t1 && t2 && !a.bola.enMano && !b.bola.enMano && a.bola.v.length() > 1 && b.bola.v.length() > 1);
[a, b] = nueva(); poner(a, -1, 0); poner(b, 1, 0);
tirar(a, -1, -12); correr(0.4);
r = tirar(b, 1, -12);
check('Uno tira mientras la bola del otro va rodando', r && a.bola.v.length() > 0.5 && b.bola.v.length() > 0.5);
check('No puede volver a tirar mientras su bola rueda', !B.puedeDisparar(a), B.motivoNoTiro(a));

// 2. LA VERDAD
[a, b] = nueva(); poner(a, 0, -5); poner(b, 0, -7);
tirar(a, 0, -7, 2); correr(7);
check('Sin LA VERDAD, el golpe no elimina', a.vivo && b.vivo && b.bola.p.z < -7.3, `Beto quedó en z=${f2(b.bola.p.z)}`);
[a, b] = nueva(); a.verdad = true; poner(a, 0, -5); poner(b, 0, -7);
tirar(a, 0, -7, 2); correr(8);
check('Con LA VERDAD, el golpe elimina', !b.vivo && ev('eliminado').length === 1 && B.estado().fin);
[a, b] = nueva(); b.verdad = true; poner(a, 0, -5); poner(b, 0, -7);
tirar(a, 0, -7, 2); correr(7);
check('Sin LA VERDAD, pegarle al que la tiene se la quita', !b.verdad && a.vivo && b.vivo && ev('verdad-quitada').length === 1);
// orden de encholar: los dos van al hueco, el primero que entra se queda con LA VERDAD
[a, b] = nueva(); poner(a, 0, -18.8); poner(b, 1.5, -20);
tirar(a, 0, -20, 0.05); tirar(b, 0, -20, 0.05); correr(6);
const huecos = ev('hueco'), verdades = ev('verdad');
check('LA VERDAD es para el primero que enchola', verdades.length === 1 && huecos.length >= 1 && verdades[0].jugador === huecos[0].jugador,
  `entraron: ${huecos.map(h => h.jugador + ' t=' + h.t).join(', ')}; verdad: ${verdades.map(v => v.jugador).join(',')}`);

// 3. Barrera
[a, b] = nueva(); a.verdad = true; poner(a, 0, -5); poner(b, 0, -7);
r = B.activarPoder(b, 'barrera');
tirar(a, 0, -7, 2); correr(7);
check('Barrera aguanta un golpe válido aunque el rival tenga LA VERDAD', r.ok && b.vivo && ev('barrera-aguanto').length === 1 && b.escudo === 0);
check('Barrera: no se pueden poner dos seguidas', !B.activarPoder(b, 'barrera').ok);

// 4. Poder Cero
[a, b] = nueva(); poner(a, 0, -5); poner(b, 0, -7);
r = B.activarPoder(a, 'cero');
const neg = B.activarPoder(b, 'barrera');
check('Poder Cero primero: el rival no puede poner barrera', r.ok && !neg.ok && /Bloqueado/.test(neg.motivo), neg.motivo);
check('Poder Cero no quita los controles: el bloqueado puede tirar', B.puedeDisparar(b) && tirar(b, 0, -12));
correr(3.2);
check('Poder Cero se acaba a los 3 s', b.bloqueo === 0 && B.activarPoder(b, 'barrera').ok);
[a, b] = nueva(); a.verdad = true; poner(a, 0, -5); poner(b, 0, -7);
const pb = B.activarPoder(b, 'barrera'), pc = B.activarPoder(a, 'cero');
const ordenOk = ev('poder')[0].poder === 'barrera' && ev('poder')[1].poder === 'cero' && ev('poder')[0].seq < ev('poder')[1].seq;
check('Barrera primero: Poder Cero no la quita', pb.ok && pc.ok && b.escudo > 0 && b.bloqueo > 0 && ordenOk);
tirar(a, 0, -7, 2); correr(7);
check('Barrera primero: sigue protegiendo bajo Poder Cero', b.vivo && ev('barrera-aguanto').length === 1);
check('Poder Cero: usos limitados (2 por partida)', P.porId('cero').usos === 2 && a.usos.cero === 1);

// 5. Descuadris
[a, b] = nueva(); poner(a, -2, -5); poner(b, 3, -9);
r = B.activarPoder(a, 'descuadris');
check('Descuadris intercambia las canicas', r.ok && f2(a.bola.p.x) === '3.00' && f2(a.bola.p.z) === '-9.00' && f2(b.bola.p.x) === '-2.00' && f2(b.bola.p.z) === '-5.00' && a.bola.p.y === N.R && b.bola.p.y === N.R);
check('Descuadris no elimina a nadie', a.vivo && b.vivo);
check('Descuadris: solo una vez por partida', !B.activarPoder(a, 'descuadris').ok);
[a, b] = nueva(); poner(a, 0, -15); poner(b, 0, -20); b.bola.enHueco = true;
r = B.activarPoder(a, 'descuadris');
check('Descuadris no deja poner una canica dentro del hueco', !r.ok, r.motivo);
[a, b] = nueva(); poner(a, 0, 0); poner(b, 0, -40);
r = B.activarPoder(a, 'descuadris');
check('Descuadris respeta la distancia máxima', !r.ok, r.motivo);

// 6. Nochera muere
[a, b] = nueva(); a.verdad = true; poner(a, 0, -19.3); poner(b, 4, -12);
tirar(a, 0, -20, 0.05);
B.alChocar(a.bola, b.bola, 2, 2, 0);   // el golpe al rival ocurre al comienzo del tiro
const tocado = !!b.pendiente;
correr(5);
check('Nochera muere: golpea, se mete al hueco y pierde él', tocado && !a.vivo && b.vivo && !b.pendiente && ev('nochera-muere').length === 1);
[a, b] = nueva(); poner(a, 0, -19.3); poner(b, 4, -12);
tirar(a, 0, -20, 0.05); B.alChocar(a.bola, b.bola, 2, 2, 0); correr(5);
check('Nochera: sin LA VERDAD no aplica (configurable) y gana LA VERDAD', a.vivo && b.vivo && a.verdad && ev('nochera-muere').length === 0);

// 7. Carambola muere
check('Carambola muere está preparada pero apagada', P.REGLAS.carambola.activa === false && P.REGLAS.carambola.evaluar === null);

// 8. Poderes extra
[a, b] = nueva(false); poner(a, 0, 0);
check('Poderes extra apagados por defecto', !B.activarPoder(a, 'superpotencia').ok);
[a, b] = nueva(true); poner(a, 0, 0); poner(b, 5, 0);
B.activarPoder(a, 'superpotencia'); B.disparar(a, 0, 0.5);
const esperado = N.velDeFuerza(0.5) * P.porId('superpotencia').factor;
check('Superpotencia: el tiro sale 35 % más fuerte', Math.abs(a.bola.v.length() - esperado) < 0.01, `${f2(a.bola.v.length())} vs ${f2(esperado)}`);
r = B.activarPoder(b, 'congelacion'); correr(0.1);
check('Congelación: la bola del rival frena más', r.ok && a.bola.freno === 3 && !!a.efectos.congelado);
correr(3.1);
check('Congelación se acaba', a.bola.freno === 1 && !a.efectos.congelado);
[a, b] = nueva(true); poner(a, 0, -5); poner(b, 0, -7);
B.activarPoder(a, 'turbo'); correr(0.05);
check('Turbo: su bola frena menos', a.bola.freno === P.porId('turbo').freno);
B.activarPoder(a, 'trueno'); tirar(a, 0, -7, 2); correr(1);
check('Golpe trueno: el golpe empuja más fuerte', ev('trueno').length === 1 && b.vivo);
check('Rebote fantasma queda preparado pero apagado', !B.activarPoder(a, 'fantasma').ok && P.porId('fantasma').habilitado === false);

// 9. Partida completa con la máquina
B.iniciar({ambosIA: true, nombres: ['IA 1', 'IA 2'], extras: false, sinCuenta: true});
let s = 0; while (!B.estado().fin && s < 240){ correr(1); s++; }
const usados = ev('poder').map(e => e.jugador + ':' + e.poder);
check('La máquina contra la máquina termina una partida', B.estado().fin, `ganó ${B.estado().ganador} en ${s} s; poderes: ${usados.join(', ') || 'ninguno'}`);
} catch (e){ mal++; console.log('[test] FALLA excepción: ' + e.message + ' ' + (e.stack || '').split('\n')[1]); }

console.log(`[test] RESUMEN ${ok} pasan, ${mal} fallan`);
})();
