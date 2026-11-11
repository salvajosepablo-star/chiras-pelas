// =====================================================================
// CHIRAS PELAS — Poderes y reglas del modo Batalla
// ---------------------------------------------------------------------
// Aquí está todo lo que se puede ajustar sin tocar el resto del juego:
//  - CONFIG: números del modo batalla (tiempos, distancias, reglas).
//  - PODERES: cada poder es un objeto. Para agregar uno nuevo, se copia
//    uno parecido, se le cambia el id y se escribe su función activar().
//  - REGLAS: reglas tradicionales (Nochera muere, Carambola muere).
// Los tiempos están en segundos y las distancias en metros del juego.
// =====================================================================
(function(){

const CONFIG = {
  disparo: {
    velQuieta: 0.25,        // la bola debe ir más despacio que esto para poder tirar otra vez
    esperaTrasTiro: 0.4     // pausa mínima entre dos tiros del mismo jugador
  },
  impactoMin: 0.5,
  turnoEnchole: {
    activo: true,           // el que enchola tira y los demás quedan congelados hasta su siguiente tiro
    maxSeg: 20,             // si no tira en este tiempo, se descongelan solos (para que nadie se quede trabado)
    permitirDefensa: true   // los congelados sí pueden poner Barrera para defenderse (como cantar en el clásico)
  },
  iman: {                   // ayuda para encholar (se activa en el menú de batalla)
    radio: 0.45,            // metros extra alrededor del hueco donde jala (solo muy cerquita)
    fuerza: 6,              // qué tan fuerte jala (la orilla normal jala 2,2)
    velJalon: 4,            // jala bolas que van más despacio que esto (normal: 1,6)
    velCaptura: 4.5,        // se cae al hueco si va más despacio que esto (normal: 3)
    amortiguar: 12          // qué tanto le frena el movimiento de lado para que no pase de largo
  },          // fuerza mínima del choque (m/s) para que cuente como golpe válido
  cuentaInicial: 3,         // cuenta regresiva antes de la salida
  verdad: {
    quitarConGolpe: true    // si el que no tiene LA VERDAD le pega al que la tiene, se la quita
  },
  nochera: {
    activa: true,           // NOCHERA MUERE encendida
    soloConVerdad: true,    // solo aplica si el que tira tiene LA VERDAD (si es false, aplica a cualquier golpe)
    esperaMax: 6            // segundos máximos esperando a que pare la bola del que golpeó
  },
  ia: {
    reaccionMin: 0.9, reaccionMax: 2.2,   // segundos que la máquina espera antes de tirar
    defensaMin: 0.25, defensaMax: 0.8,    // segundos que tarda en reaccionar con un poder
    errorAng: 0.045, errorVel: 0.09       // pulso de la máquina
  }
};

// ---------------------------------------------------------------------
// Cada poder tiene:
//   id, nombre, icono, color, voz (lo que dice el narrador)
//   principal: true = siempre disponible; false = "poder extra" (se enciende en el menú)
//   habilitado: false = preparado pero apagado
//   duracion, recarga (segundos), usos (por partida)
//   puede(ctx, j): devuelve un texto si NO se puede usar ahora (o null si sí)
//   activar(ctx, j): lo que hace
// ctx es la caja de herramientas que da batalla.js (ver CTX en batalla.js)
// ---------------------------------------------------------------------
const PODERES = [
  {
    id: 'barrera', nombre: 'Barrera', corto: 'Barrera', icono: '🛡️', color: '#3ad1ff', sonido: 'barrera',
    voz: '¡Barrera activada!', principal: true, habilitado: true, defensivo: true,
    duracion: 6, recarga: 10, usos: 3,
    puede(ctx, j){ return j.escudo > 0 ? 'Ya tiene la barrera puesta' : null; },
    activar(ctx, j){ ctx.ponerEscudo(j, this.duracion); }
  },
  {
    id: 'cero', nombre: 'Poder Cero', corto: 'Cero', icono: '⚡', color: '#ffe14a', sonido: 'electrico',
    voz: '¡Poder cero!', principal: true, habilitado: true,
    duracion: 3, recarga: 15, usos: 2,
    activar(ctx, j){ ctx.rivales(j).forEach(r => ctx.bloquear(r, this.duracion, j)); }
  },
  {
    // Solo con LA VERDAD. Al rival le impide activar poderes defensivos nuevos (Barrera, Descuadris).
    // Lo que el rival ya tenía activo (por ejemplo una Barrera puesta antes) se respeta.
    // No elimina a nadie: el que lo usa todavía tiene que acertar el tiro.
    id: 'nada', nombre: 'Nada de nada', corto: 'Nada', icono: '🚫', color: '#ff5d73', sonido: 'nada',
    voz: '¡Nada de nada!', principal: true, habilitado: true,
    duracion: 3, recarga: 15, usos: 2,
    puede(ctx, j){ if (!j.verdad) return 'Solo se puede con LA VERDAD'; return ctx.rivalObjetivo(j) ? null : 'No hay rival'; },
    activar(ctx, j){ ctx.nadaDeNada(ctx.rivalObjetivo(j), this.duracion, j); }
  },
  {
    id: 'descuadris', nombre: 'Descuadris', corto: 'Descuadris', icono: '🔄', color: '#c77dff', sonido: 'teleport',
    voz: '¡Descuadris!', principal: true, habilitado: true, defensivo: true,
    duracion: 0, recarga: 20, usos: 1,
    distanciaMax: 15,        // distancia máxima entre las dos canicas para poder cambiarse (0 = sin límite)
    conservarVelocidad: true,// cada canica sigue con su movimiento después del cambio
    puede(ctx, j){ return ctx.revisarDescuadris(j, this.distanciaMax).motivo; },
    activar(ctx, j){ ctx.intercambiar(j, ctx.revisarDescuadris(j, this.distanciaMax).rival, this.conservarVelocidad); }
  },

  // ----- Poderes extra (se encienden en el menú: "Poderes extra (en prueba)") -----
  {
    id: 'superpotencia', nombre: 'Superpotencia', corto: 'Súper', icono: '💪', color: '#ff7b2e', sonido: 'superpotencia',
    voz: '¡Superpotencia!', principal: false, habilitado: true,
    duracion: 8, recarga: 25, usos: 1,
    factor: 1.35,            // el siguiente tiro sale con 35 % más de fuerza
    activar(ctx, j){ ctx.efecto(j, 'superpotencia', this.duracion, {factor: this.factor}); }
  },
  {
    id: 'congelacion', nombre: 'Congelación', corto: 'Hielo', icono: '❄️', color: '#9fe8ff', sonido: 'congelacion',
    voz: '¡Congelación!', principal: false, habilitado: true,
    duracion: 3, recarga: 25, usos: 1,
    freno: 3,                // la bola del rival frena 3 veces más
    fuerzaTiro: 0.6,         // y sus tiros salen con el 60 % de la fuerza
    activar(ctx, j){ ctx.rivales(j).forEach(r => ctx.efecto(r, 'congelado', this.duracion, {freno: this.freno, fuerzaTiro: this.fuerzaTiro})); }
  },
  {
    id: 'turbo', nombre: 'Turbo', corto: 'Turbo', icono: '🚀', color: '#5cff8a', sonido: 'turbo',
    voz: '¡Turbo!', principal: false, habilitado: true,
    duracion: 5, recarga: 25, usos: 1,
    freno: 0.45,             // su bola frena menos y llega más lejos
    activar(ctx, j){ ctx.efecto(j, 'turbo', this.duracion, {freno: this.freno}); }
  },
  {
    id: 'trueno', nombre: 'Golpe Trueno', corto: 'Trueno', icono: '🌩️', color: '#b8a6ff', sonido: 'trueno',
    voz: '¡Golpe trueno!', principal: false, habilitado: true,
    duracion: 8, recarga: 30, usos: 1,
    fuerza: 1.15,            // el siguiente tiro sale un poco más fuerte
    empuje: 1.7,             // y al pegarle a una bola la manda 1,7 veces más lejos
    activar(ctx, j){ ctx.efecto(j, 'trueno', this.duracion, {fuerza: this.fuerza, empuje: this.empuje}); }
  },
  {
    id: 'fantasma', nombre: 'Rebote Fantasma', corto: 'Fantasma', icono: '👻', color: '#e0e0ff', sonido: 'teleport',
    voz: '¡Rebote fantasma!', principal: false, habilitado: false,
    pendiente: 'Falta definir cómo es el rebote especial.',
    duracion: 0, recarga: 30, usos: 1,
    activar(){ /* pendiente de definir */ }
  }
];

// ---------------------------------------------------------------------
// Reglas tradicionales
// ---------------------------------------------------------------------
const REGLAS = {
  nochera: {
    nombre: 'Nochera muere', voz: '¡Nochera muere!',
    get activa(){ return CONFIG.nochera.activa; }
    // La lógica está en batalla.js (alEntrarHueco): si el que tiró ya golpeó
    // al rival en ese tiro y su bola entra al hueco, pierde él y el rival se salva.
  },
  carambola: {
    nombre: 'Carambola muere', voz: '¡Carambola muere!',
    activa: false,           // APAGADA hasta definir sus condiciones exactas
    pendiente: 'Falta definir las condiciones exactas.',
    // Cuando se defina: escribir aquí evaluar(ctx, tiro) que devuelva
    // {muere: jugador, motivo: '...'} o null. batalla.js ya la llama al final de cada tiro.
    evaluar: null
  }
};

// ---------------------------------------------------------------------
// Combos: dos poderes compatibles activos al tiempo dan un efecto extra.
// No reinician recargas ni dan usos de más. Necesitan los poderes extra.
// activo(id) dice si ese poder del jugador está funcionando en este momento.
// ---------------------------------------------------------------------
const COMBOS = [
  {id: 'escape', nombre: 'Escape blindado', icono: '🚀🛡️', requiere: ['turbo', 'barrera'], voz: '¡Combo escape blindado!',
   descripcion: 'La barrera y el turbo duran 2 s más.',
   aplicar(ctx, j){ if (j.escudo > 0) j.escudo += 2; if (j.efectos.turbo) j.efectos.turbo.resta += 2; }},
  {id: 'rayo', nombre: 'Rayo total', icono: '💪🌩️', requiere: ['superpotencia', 'trueno'], voz: '¡Combo rayo total!',
   descripcion: 'El golpe trueno empuja 20 % más.',
   aplicar(ctx, j){ if (j.efectos.trueno) j.efectos.trueno.empuje *= 1.2; }},
  {id: 'glaciar', nombre: 'Glaciar', icono: '❄️⚡', requiere: ['congelacion', 'cero'], voz: '¡Combo glaciar!',
   descripcion: 'El bloqueo y la congelación del rival duran 1 s más.',
   aplicar(ctx, j){ ctx.rivales(j).forEach(r => { if (r.bloqueo > 0) r.bloqueo += 1; if (r.efectos.congelado) r.efectos.congelado.resta += 1; }); }}
];

// Ajustes del espectáculo (solo se ven y se oyen, no cambian las reglas)
const ESPECTACULO = {
  crecer: 1.35,                 // cuánto crece (solo a la vista) la canica que tiene LA VERDAD
  eliminacion: 'azar',          // 'azar', 'aplastar' o 'explotar'
  fragmentos: 300,              // chispas en una eliminación
  maestro: {golpe: 8, enchole: 12},   // metros desde donde un golpe o un enchole es "tiro maestro"
  repeticion: 'extraordinaria', // 'extraordinaria' (tiro maestro o nochera), 'todas' o 'nunca'
  eventos: {cadaMin: 12, cadaMax: 20, viento: 0.8, movedizaFreno: 3, movedizaRadio: 2.5, rapidoFreno: 0.6}
};

const porId = id => PODERES.find(p => p.id === id);
window.ChirasPoderes = {CONFIG, PODERES, REGLAS, COMBOS, ESPECTACULO, porId};
})();
