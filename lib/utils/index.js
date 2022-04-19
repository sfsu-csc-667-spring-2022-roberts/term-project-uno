const { findUserById } = require('../../db/dao/users');
const { findAllLobbyGuests } = require('../../db/dao/lobbyGuests');

async function formatLobbyInfo(lobby) {
  const results = await Promise.allSettled([findAllLobbyGuests(lobby.id), findUserById(lobby.hostId)]);
  const lobbyGuests = results[0].value;
  const host = results[1].value;
  return {
    id: lobby.id,
    name: lobby.name,
    guestLength: lobbyGuests ? lobbyGuests.length : 0,
    hostName: host.username ? host.username : "",
    busy: lobby.busy,
    playerCapacity: lobby.playerCapacity,
    createdAt: lobby.createdAt
  };
}

async function formatAllLobbyInfo(lobbies) {
  const asyncTasks = [];
  if (lobbies) {
    lobbies.forEach((lobby) => {
      asyncTasks.push(formatLobbyInfo(lobby));
    })
  }

  const results = await Promise.allSettled(asyncTasks);
  return results.map((result) => {
    if (result.status === 'fulfilled') return result.value;
  });
}

function calculateWinRate(user) {
  const { gamesPlayed, gamesWon } = user;
  return gamesPlayed > 0 ? (gamesWon / gamesPlayed).toFixed(4) * 100 : 0;
}

module.exports = {
  formatLobbyInfo,
  formatAllLobbyInfo,
  calculateWinRate
}