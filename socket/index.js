const socketIo = require('socket.io');
const { joinSocketInvitationRoom } = require('./invitations');
const { joinSocketLobbyRoom } = require('./lobbies');
const { initializeGameEndpoints } = require('./games');
const { parseToken } = require('../lib/utils/token');
const { parseCookies } = require('../lib/utils/cookies');
const { addToUserSockets, removeFromUserSockets } = require('../lib/utils/socket');
const io = socketIo();

io.on('connection', async (socket) => {
  const cookies = parseCookies(socket.handshake.headers.cookie);
  const user = cookies.token ? await parseToken(cookies.token) : null;

  if (user) {
    socket.join(user.id);
    addToUserSockets(user.id, socket);
  }

  socket.on('disconnect', () => {
    if (user) removeFromUserSockets(user.id, socket);
  });

  joinSocketInvitationRoom(socket, user);
  joinSocketLobbyRoom(socket, user);
  initializeGameEndpoints(io, socket, user);
});

module.exports = io;