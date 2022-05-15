const db = require('../index');
const PlayerDao = require('./players');
const PlayedCardDao = require('./playedCards');
const PlayerCardDao = require('./playerCards')

async function findGameState(gameId, userId) {
  /* Set up db query */
  const findDrawCardsCount = async () => {
    return db.query(`
      SELECT "cardId"
      FROM "DrawCards"
      WHERE "gameId" = $1`, [gameId])
    .then((results) => {
      if (results) return Promise.resolve(results.length);
      return Promise.resolve(0);
    })
    .catch((err) => Promise.reject(err));
  };

  /* Execute db queries */
  return Promise.all([    
    findGame(gameId), 
    PlayerDao.findPlayersWithFullInfo(gameId),
    PlayedCardDao.findAllPlayedCards(gameId),
    PlayerCardDao.findPlayerCardsByUserId(userId, gameId),
    findDrawCardsCount()
  ])
  .then(async (results) => {
    return {
      turnIndex: results[0].turnIndex,
      currentColor: results[0].currentColor,
      playerOrderReversed: results[0].playerOrderReversed,
      players: results[1],
      playedDeck: results[2],
      mainDeck: results[3],
      drawDeckCount: results[4],
    }
  })
  .catch((err) => Promise.reject(err));
}

async function findGame(gameId) {
  return db.query(`
    SELECT *
    FROM $1:name
    WHERE id = $2`, ['Games', gameId])
  .then((games) => {
    if (games && games.length === 1) return Promise.resolve(games[0]);
    else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

async function findGameWithLobby(lobbyId) {
  return db.query(`
    SELECT *
    FROM "Games"
    WHERE "lobbyId" = $1
  `, [lobbyId])
  .then((games) => {
    if (games && games.length === 1) return Promise.resolve(games[0]);
    else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

async function createGame(currentColor, lobbyId){
  return db.any(`
    INSERT INTO $1:name($2:name, "turnIndex", "playerOrderReversed", "active", $3:name)
    VALUES($4, $5, $6, $7, $8)
    RETURNING *`,
    ['Games', 'currentColor', 'lobbyId', currentColor, 0, false, true, lobbyId])
  .then((result) => {
    if (result) {
      return Promise.resolve(result[0]);
    } else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(err));
}

async function gameWithLobbyExists(lobbyId) {
  return db.query(`
    SELECT *
    FROM "Games"
    WHERE "lobbyId" = $1
  `, [lobbyId])
  .then((games) => {
    if (games && games.length >= 1) return Promise.resolve(true);
    else return Promise.resolve(false);
  })
  .catch((err) => Promise.reject(err));
} 

async function updateColor(color, gameId) {
  return db.any(`
  UPDATE "Games"
  SET "currentColor" = $1
  WHERE "id" = $2
  `, [color, gameId])
  .then((results) => {
    if (results) return Promise.resolve(true);
    else return Promise.resolve(false);
  })
  .catch((err) => Promise.reject(err));
}

async function updateTurn(turnIndex, gameId) {
  return db.any(`
    UPDATE "Games"
    SET "turnIndex" = $1
    WHERE "id" = $2
    RETURNING *
  `, [turnIndex, gameId])
  .then((results) => {
    if (results && results.length == 1) return Promise.resolve(true);
    else return Promise.resolve(false);
  })
  .catch((err) => Promise.reject(err));
}

async function updateReversed(playerOrderReversed, gameId) {
  return db.any(`
    UPDATE "Games"
    SET "playerOrderReversed" = $1
    WHERE "id" = $2
  `, [playerOrderReversed, gameId])
  .then((results) => {
    if (results && results.length == 1) return Promise.resolve(true);
    else return Promise.resolve(false);
  })
  .catch((err) => Promise.reject(err));
}

async function deleteGame(gameId) {
  return db.any(`
    DELETE 
    FROM "GameMessages"
    WHERE "gameId" = $1;
    DELETE
    FROM "Players"
    WHERE "gameId" = $1;
    DELETE
    FROM "DrawCards"
    WHERE "gameId" = $1;
    DELETE
    FROM "PlayedCards"
    WHERE "gameId" = $1;
    DELETE 
    FROM "Games"
    WHERE id = $1
  `, [gameId])
  .catch((err) => Promise.reject(err));
}

async function findUsernamesInGame(gameId) {
  return db.any(`
  SELECT "username" FROM "Users" WHERE "id" IN
  (SELECT "userId" FROM "Players" WHERE "gameId" = $1 )
  `, [gameId])
  .then((results) => {
    if (results && results.length > 0) return Promise.resolve(results);
    else return Promise.resolve(null);
  })
  .catch((err) => Promise.reject(null));
}

module.exports = {
  findGameState,
  findGame,
  findGameWithLobby,
  createGame,
  gameWithLobbyExists,
  updateColor,
  updateTurn,
  updateReversed,
  deleteGame,
  findUsernamesInGame
}
