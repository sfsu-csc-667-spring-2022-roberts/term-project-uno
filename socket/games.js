const PlayerDao = require('../db/dao/players');
const MessageDao = require('../db/dao/messages');
const PlayerCardsDao = require('../db/dao/playerCards');
const PlayedCardsDao = require('../db/dao/playedCards');
const CardsDao = require('../db/dao/cards');
const GamesDao = require('../db/dao/games');
const { emitBasedOnCardType } = require('../lib/utils/socket');

async function initializeGameEndpoints(io, socket, user) {
  if (user) {
    try {
      const referer = socket.handshake.headers.referer;
      if (referer) {
        const requestUrl = new URL(referer);
        const pathnameSplit = requestUrl.pathname.split('/');
        if (pathnameSplit.length === 3 && pathnameSplit[1] === 'games') {
          const gameId = pathnameSplit[2];
          if (await PlayerDao.verifyUserInGame(data.gameId, user.id)) {
            socket.join(`game/${gameId}`);
          }
        }
      }
    } catch (err) {
      console.error('Error occured when attempting to join socket game room\n', err);
    }
  }

  socket.on('game-message-send', async (message) => {
    try {
      data = JSON.parse(message);
      
      if (!user || !(await PlayerDao.verifyUserInGame(data.gameId, user.id))) return;

      const messageObj = await MessageDao.createGameMessage(data.message, user.id, data.gameId);

      messageObj.sender = user.username;
      delete messageObj.userId;
      delete messageObj.gameId;

      io.to(`game/${data.gameId}`).emit('game-message-send', messageObj);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('play-card', async (message) => {
    try {
      data = JSON.parse(message);

      if (!user || !(await PlayerDao.verifyUserInGame(data.gameId, user.id))) return;

      const players = await PlayerDao.findPlayers(user.id);

      // TODO: Check card count

      // if findPlayers does not return 1, or the player does not actually have the card, --> return
      if (players.length !== 1 || !(await PlayerCardsDao.verifyPlayerCard(data.cardId, players[0].id))) return;

      const card = await CardsDao.getCard(data.cardId);
      const topOfPlayedCardsResult = await PlayedCardsDao.findTopOfPlayedCards(data.gameId);
      const topOfPlayedCards = await CardsDao.getCard(topOfPlayedCardsResult.cardId);
      const games = await GamesDao.findGame(data.gameId);

      if (!card || !topOfPlayedCardsResult || !topOfPlayedCards || !games) return;

      // if it is not the player's turn, or (the current color is not equal to the card's color, and 
      // the card value is not the same as the one at the top of the played cards, and the card is not a wild card) --> return
      if (games[0].turnIndex !== players[0].turnIndex || (games[0].currentColor !== card.color && card.value !== topOfPlayedCards.value && card.color !== "wild")) {console.log("WRONG MOVE"); return; }

      emitBasedOnCardType(games[0], players[0].id, card, io);

    } catch (err) {
      console.error(err);
    }
  });
}

module.exports = { initializeGameEndpoints };