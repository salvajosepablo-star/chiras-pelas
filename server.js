const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = process.env.PORT || 80;
const BASE_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0].replace(/^\/+/, '');
  if (!reqPath) reqPath = 'index.html';
  const filePath = path.normalize(path.join(BASE_DIR, reqPath));

  if (!filePath.startsWith(BASE_DIR)) {
    res.writeHead(403);
    res.end('Acceso denegado');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404);
      res.end('No encontrado');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

const wss = new WebSocket.Server({ server });

// Gestión de salas
const rooms = new Map(); // roomId -> { id, host, players: Map(ws -> playerInfo), state }

function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 4; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function broadcastToRoom(roomId, message, senderWs = null) {
  const room = rooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(message);
  for (const [ws] of room.players) {
    if (ws !== senderWs && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

function getRoomPlayerList(room) {
  const list = [];
  for (const [, p] of room.players) {
    list.push({
      id: p.id,
      nombre: p.nombre,
      color: p.color,
      isHost: p.isHost,
      listo: p.listo,
      juega: p.juega
    });
  }
  return list;
}

wss.on('connection', (ws) => {
  let currentRoomId = null;
  let playerId = 'p_' + Math.random().toString(36).substr(2, 9);

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw);

      switch (data.tipo) {
        case 'CREAR_SALA': {
          let roomId = generateRoomId();
          while (rooms.has(roomId)) roomId = generateRoomId();

          const room = {
            id: roomId,
            hostId: playerId,
            players: new Map(),
            estado: 'espera',
            modo: data.modo || 'clasico'
          };
          rooms.set(roomId, room);
          currentRoomId = roomId;

          const player = {
            id: playerId,
            nombre: data.nombre || 'Jugador 1',
            color: 0xf5c518, // amarillo
            isHost: true,
            listo: true,
            juega: 'clasica'
          };
          room.players.set(ws, player);

          ws.send(JSON.stringify({
            tipo: 'SALA_CREADA',
            roomId,
            player,
            jugadores: getRoomPlayerList(room),
            modo: room.modo
          }));
          break;
        }

        case 'UNIRSE_SALA': {
          const roomId = (data.roomId || '').toUpperCase().trim();
          const room = rooms.get(roomId);

          if (!room) {
            ws.send(JSON.stringify({ tipo: 'ERROR', mensaje: 'La sala no existe' }));
            return;
          }
          if (room.players.size >= 4) {
            ws.send(JSON.stringify({ tipo: 'ERROR', mensaje: 'La sala está llena (máx 4)' }));
            return;
          }
          if (room.estado !== 'espera') {
            ws.send(JSON.stringify({ tipo: 'ERROR', mensaje: 'La partida ya comenzó' }));
            return;
          }

          currentRoomId = roomId;
          const colors = [0xf5c518, 0x1d55b3, 0xd7263d, 0x20a65a];
          const player = {
            id: playerId,
            nombre: data.nombre || `Jugador ${room.players.size + 1}`,
            color: colors[room.players.size % colors.length],
            isHost: false,
            listo: true,
            juega: 'clasica'
          };
          room.players.set(ws, player);

          ws.send(JSON.stringify({
            tipo: 'UNIDO_EXITO',
            roomId,
            player,
            jugadores: getRoomPlayerList(room),
            modo: room.modo
          }));

          broadcastToRoom(roomId, {
            tipo: 'JUGADOR_ENTRO',
            jugadores: getRoomPlayerList(room),
            mensaje: `${player.nombre} se unió a la sala`
          }, ws);
          break;
        }

        case 'INICIAR_PARTIDA': {
          const room = rooms.get(currentRoomId);
          if (!room || room.hostId !== playerId) return;
          if (room.players.size < 2) {
            ws.send(JSON.stringify({ tipo: 'ERROR', mensaje: 'Se necesitan mínimo 2 jugadores' }));
            return;
          }

          room.estado = 'jugando';
          const playerList = getRoomPlayerList(room);
          broadcastToRoom(currentRoomId, {
            tipo: 'PARTIDA_INICIADA',
            jugadores: playerList,
            modo: room.modo
          });
          ws.send(JSON.stringify({
            tipo: 'PARTIDA_INICIADA',
            jugadores: playerList,
            modo: room.modo
          }));
          break;
        }

        case 'ACCION_JUEGO': {
          // Retransmitir tiros, cantos, apuntado a los demás
          if (!currentRoomId) return;
          broadcastToRoom(currentRoomId, {
            tipo: 'ACCION_REMOTO',
            jugadorId: playerId,
            accion: data.accion,
            detalles: data.detalles
          }, ws);
          break;
        }

        case 'VOZ_SENAL': {
          // Señalización WebRTC para el Comunicador de Voz en vivo
          if (!currentRoomId) return;
          broadcastToRoom(currentRoomId, {
            tipo: 'VOZ_SENAL',
            de: playerId,
            senal: data.senal
          }, ws);
          break;
        }
      }
    } catch (e) {
      console.error('Error procesando mensaje ws:', e);
    }
  });

  ws.on('close', () => {
    if (currentRoomId && rooms.has(currentRoomId)) {
      const room = rooms.get(currentRoomId);
      const leavingPlayer = room.players.get(ws);
      room.players.delete(ws);

      if (room.players.size === 0) {
        rooms.delete(currentRoomId);
      } else {
        // Asignar nuevo host si salió el host
        if (room.hostId === playerId) {
          const [firstWs, firstPlayer] = room.players.entries().next().value;
          firstPlayer.isHost = true;
          room.hostId = firstPlayer.id;
        }

        broadcastToRoom(currentRoomId, {
          tipo: 'JUGADOR_SALIO',
          jugadorId: playerId,
          jugadores: getRoomPlayerList(room),
          mensaje: leavingPlayer ? `${leavingPlayer.nombre} abandonó la sala` : 'Un jugador abandonó la sala'
        });
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor Chiras Pelas (con WebSockets Online) corriendo en puerto ${PORT}`);
});
