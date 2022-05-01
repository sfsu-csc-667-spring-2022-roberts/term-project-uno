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

  return gamesPlayed > 0 ? Math.round(gamesWon / gamesPlayed * 10000) * .01 : 0;
}

function timeSince(dateObj) {
  const seconds = Math.floor((new Date() - dateObj) / 1000);
  let interval = seconds / 31536000;

  if (interval > 1) {
    const year = Math.floor(interval);
    if (year == 1) return '1 year';
    return year + ' years';
  }

  interval = seconds / 2592000;
  if (interval > 1) {
    const month = Math.floor(interval)
    if (month == 1) return '1 month';
    return month + ' months';
  }

  interval = seconds / 86400;
  if (interval > 1) {
    const day = Math.floor(interval);
    if (day == 1) return '1 day';
    return day + ' days';
  }

  interval = seconds / 3600;
  if (interval > 1) {
    const hour = Math.floor(interval);
    if (hour == 1) return '1 hour';
    return hour + ' hours';
  }

  interval = seconds / 60;
  if (interval > 1) {
    const minute = Math.floor(interval);
    if (minute == 1) return '1 minute';
    else if (minute == 60) return '1 hour';
    return minute + ' minutes';
  }

  const second = Math.floor(seconds);
  if (isNaN(second) || second == 1) '1 second';
  else if (second == 60) return '1 minute';
  return second + ' seconds';
}

module.exports = {
  formatLobbyInfo,
  formatAllLobbyInfo,
  calculateWinRate,
  timeSince
}