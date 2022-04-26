const db = require('../index');

async function findGameState(gameId, userId) {
  /* Set up db queries */
  const findAllPlayers = async () => {
    return db.query(`
      SELECT *
      FROM "Players"
      WHERE "gameId" = $1`, [gameId])
    .then((results) => {
      if (results && results.length > 0) return Promise.resolve(results);
      else return Promise.resolve(null);
    })
    .catch((err) => Promise.reject(err));
  };
  const findPlayerCards = async () => {
    return db.query(`
      SELECT *
      FROM "Players"
      WHERE "gameId" = $1 AND "userId" = $2`, [gameId, userId])
    .then((results) => {
      if (results && results.length === 1) {
        return db.query(`
          SELECT "cardId"
          FROM "PlayerCards"
          WHERE "playerId" = $1`, [results[0].id]);
      }
      else return Promise.reject(`User is not a player from game ${gameId}`);
    })
    .then((results) => {
      if (results) return Promise.resolve(results);
      else return Promise.resolve(null);
    })
    .catch((err) => Promise.reject(err));
  };
  const findAllPlayedCards = async () => {
    return db.query(`
      SELECT *
      FROM "PlayedCards"
      WHERE "gameId" = $1`, [gameId])
    .then((results) => {
      if (results && results.length > 0) return Promise.resolve(results);
      else return Promise.resolve(null);
    })
    .catch((err) => Promise.reject(err));
  };
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
  const findPlayerInfo = async (playerId) => {
    let player;
    return db.query(`
      SELECT *
      FROM "Players"
      WHERE id = $1`, [playerId])
    .then((results) => {
      if (results && results.length === 1) {
        const asyncTasks = [
          db.query(`
            SELECT *
            FROM "Users"
            WHERE id = $1`, [results[0].userId]),
          db.query(`
            SELECT "cardId"
            FROM "PlayerCards"
            WHERE "playerId" = $1`, [playerId])];
        player = results[0];
        return Promise.all(asyncTasks);
      }
      else return Promise.reject(`Could not find player ${playerId}`);
    })
    .then((results) => {
      const userInfo = results[0][0];
      const playerCards = results[1];
      return Promise.resolve({
        id: playerId,
        userID: userInfo.id,
        turnIndex: player.turnIndex,
        username: userInfo.username,
        cards: playerCards.length,
        avatar: userInfo.pictureUrl
      });
    })
    .catch((err) => Promise.reject(err));
  }
  const findCardInfo = async (cardId) => {
    return db.query(`
      SELECT *
      FROM "Cards"
      WHERE id = $1`, [cardId])
    .then((results) => {
      if (results && results.length === 1) return Promise.resolve(results[0]);
      else return Promise.reject(`Card information ${cardId} does not exist!`);
    })
    .catch((err) => Promise.reject(err));
  }

  /* Execute db queries */
  const asyncTasks = [
    findGame(gameId), 
    findAllPlayers(gameId), 
    findAllPlayedCards(), 
    findPlayerCards(),
    findDrawCardsCount()
  ];

  return Promise.all(asyncTasks).then(async (results) => {
    const gameInfo = results[0][0];
    const players = results[1];
    const playedCards = results[2];
    const playerCards = results[3];
    const drawDeckCount = results[4];
    const playedCardsInfo = [];
    const playersInfo = [];
    const playerCardsInfo = [];

    playedCards.forEach((playedCard) => {
      playedCardsInfo.push(findCardInfo(playedCard.cardId));
    });

    players.forEach((player) => {
      playersInfo.push(findPlayerInfo(player.id));
    })

    playerCards.forEach((playerCard) => {
      playerCardsInfo.push(findCardInfo(playerCard.cardId));
    });

    return Promise.all([
      gameInfo, 
      drawDeckCount,
      Promise.all(playedCardsInfo),
      Promise.all(playersInfo), 
      Promise.all(playerCardsInfo)]);
  })
  .then((results) => {
    const gameInfo = results[0];
    const drawDeckCount = results[1];
    const playedCardsInfo = results[2];
    const playersInfo = results[3];
    const playerCardsInfo = results[4];

    return {
      players: playersInfo,
      playedDeck: playedCardsInfo,
      mainDeck: playerCardsInfo,
      drawDeckCount,
      turnIndex: gameInfo.turnIndex,
      currentColor: gameInfo.currentColor,
      playerOrderReversed: gameInfo.playerOrderReversed
    }
  })
  .catch((err) => Promise.reject(err));
}

async function findGame(gameId) {
  return db.query(`
    SELECT *
    FROM $1:name
    WHERE id = $2`, ['Games', gameId])
  .then((results) => {
    if (results && results.length === 1) return Promise.resolve(results);
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
  `, [turnIndex, gameId])
  .then((results) => {
    if (results) return Promise.resolve(true);
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
    if (results) return Promise.resolve(true);
    else return Promise.resolve(false);
  })
  .catch((err) => Promise.reject(err));
}


module.exports = {
  findGameState,
  findGame,
  createGame,
  updateColor,
  updateTurn,
  updateReversed
}
