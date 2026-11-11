// Módulo Multijugador Online para Chiras Pelas
window.ChirasOnline = (function(){
  let ws = null;
  let miJugador = null;
  let salaActual = null;
  let esMiTurno = false;
  let jugadoresRemotos = [];
  let callbacks = {};

  function conectar() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${location.host}`;
    ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('Conectado al servidor multijugador');
      if (callbacks.onConectado) callbacks.onConectado();
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        procesarMensaje(msg);
      } catch (err) {
        console.error('Error parseando mensaje:', err);
      }
    };

    ws.onclose = (ev) => {
      console.log('Desconectado del servidor multijugador', ev);
      if (callbacks.onDesconectado) callbacks.onDesconectado();
    };

    ws.onerror = (err) => {
      console.error('Error en WebSocket:', err);
      if (callbacks.onError) callbacks.onError('Error de conexión con el servidor.');
    };
  }

  function crearSala(nombre, modo) {
    conectar();
    const send = () => {
      ws.send(JSON.stringify({
        tipo: 'CREAR_SALA',
        nombre: nombre || 'Jugador 1',
        modo: modo || 'clasico'
      }));
    };
    if (ws.readyState === WebSocket.OPEN) send();
    else ws.addEventListener('open', send, { once: true });
  }

  function unirseSala(codigo, nombre) {
    conectar();
    const send = () => {
      ws.send(JSON.stringify({
        tipo: 'UNIRSE_SALA',
        roomId: codigo,
        nombre: nombre || 'Invitado'
      }));
    };
    if (ws.readyState === WebSocket.OPEN) send();
    else ws.addEventListener('open', send, { once: true });
  }

  function iniciarPartida() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ tipo: 'INICIAR_PARTIDA' }));
    }
  }

  function enviarAccion(accion, detalles) {
    if (ws && ws.readyState === WebSocket.OPEN && salaActual) {
      ws.send(JSON.stringify({
        tipo: 'ACCION_JUEGO',
        accion,
        detalles
      }));
    }
  }

  function procesarMensaje(msg) {
    switch (msg.tipo) {
      case 'SALA_CREADA':
      case 'UNIDO_EXITO':
        salaActual = msg.roomId;
        miJugador = msg.player;
        jugadoresRemotos = msg.jugadores;
        if (callbacks.onSalaActualizada) callbacks.onSalaActualizada(msg);
        break;

      case 'JUGADOR_ENTRO':
      case 'JUGADOR_SALIO':
        jugadoresRemotos = msg.jugadores;
        if (callbacks.onSalaActualizada) callbacks.onSalaActualizada({ roomId: salaActual, jugadores: msg.jugadores, mensaje: msg.mensaje });
        break;

      case 'PARTIDA_INICIADA':
        if (callbacks.onPartidaIniciada) callbacks.onPartidaIniciada(msg);
        break;

      case 'ACCION_REMOTO':
        if (callbacks.onAccionRemota) callbacks.onAccionRemota(msg);
        break;

      case 'ERROR':
        if (callbacks.onError) callbacks.onError(msg.mensaje);
        else alert(msg.mensaje);
        break;
    }
  }

  return {
    conectar,
    crearSala,
    unirseSala,
    iniciarPartida,
    enviarAccion,
    getMiJugador: () => miJugador,
    getSalaActual: () => salaActual,
    getJugadores: () => jugadoresRemotos,
    on: (evt, fn) => { callbacks[evt] = fn; }
  };
})();
