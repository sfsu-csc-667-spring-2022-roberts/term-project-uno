const db = require('../index');

async function createGameMessage(message, userId, gameId) {
  return db.any(`
    INSERT INTO "GameMessages"(message, "userId", "gameId")
    VALUES($1, $2, $3)
    RETURNING *`, [message, userId, gameId])
  .then((messages) => {
    if (messages && messages.length === 1) {
      return Promise.all([messages[0], db.query(`
        SELECT count(*)
        FROM "GameMessages"
        WHERE "gameId" = $1
      `, [gameId])]);
    }
    else return Promise.reject('GameMessage was not created');
  })
  .then((results) => {
    const message = results[0];
    const count = results[1][0].count;
    message.id = count;
    return Promise.resolve(message);
  })
  .catch((err) => Promise.reject(err));
}

async function createLobbyMessage(message, userId, lobbyId) {
  return db.any(`
    INSERT INTO "LobbyMessages"(message, "userId", "lobbyId")
    VALUES($1, $2, $3)
    RETURNING *`, [message, userId, lobbyId])
  .then((messages) => {
    if (messages && messages.length === 1) {
      return Promise.all([messages[0], db.query(`
        SELECT count(*)
        FROM "LobbyMessages"
        WHERE "lobbyId" = $1
      `, [lobbyId])]);
    }
    else return Promise.reject('LobbyMessage was not created');
  })
  .then((results) => {
    const message = results[0];
    const count = results[1][0].count;
    message.id = count;
    return Promise.resolve(message);
  })
  .catch((err) => Promise.reject(err));
}

async function findGameMessages(gameId) {
  return db.query(`
    SELECT *
    FROM "GameMessages"
    WHERE "gameId" = $1
    ORDER BY "createdAt" ASC`, [gameId])
  .then((messages) => {
    const userIds = new Set()
    const findUsersInfo = [];
    messages.forEach((message) => {
      if (!userIds.has(message.userId)) {
        userIds.add(message.userId);
        findUsersInfo.push(
          db.query(`
            SELECT id, username
            FROM "Users"
            WHERE id = $1
          `, [message.userId])
        );
      }
    });
    return Promise.all([Promise.allSettled(findUsersInfo), messages]);
  })
  .then((results) => {
    const usersResults = results[0];
    const messages = results[1];
    let count = 1;

    messages.forEach((message) => {
      let senderFound = false;

      message.id = count;
      for (let i = 0; i < usersResults.length; i++) {
        if (usersResults[i].status === 'fulfilled') {
          const user = usersResults[i].value[0];
          if (message.userId === user.id) {
            message.sender = user.username;
            senderFound = true;
            break;
          }
        }
      }

      if (!senderFound) {
        message.sender = "Deleted User";
      }

      delete message.userId;
      delete message.gameId;
      count += 1;
    })

    return Promise.resolve(messages);
  })
  .catch((err) => Promise.reject(err));
}

async function findLobbyMessages(lobbyId) {
  return db.query(`
    SELECT *
    FROM "LobbyMessages"
    WHERE "lobbyId" = $1
    ORDER BY "createdAt" ASC`, [lobbyId])
  .then((messages) => {
    const userIds = new Set()
    const findUsersInfo = [];
    messages.forEach((message) => {
      if (!userIds.has(message.userId)) {
        userIds.add(message.userId);
        findUsersInfo.push(
          db.query(`
            SELECT id, username
            FROM "Users"
            WHERE id = $1
          `, [message.userId])
        );
      }
    });
    return Promise.all([Promise.allSettled(findUsersInfo), messages]);
  })
  .then((results) => {
    const usersResults = results[0];
    const messages = results[1];
    let count = 1;

    messages.forEach((message) => {
      let senderFound = false;

      message.id = count;
      for (let i = 0; i < usersResults.length; i++) {
        if (usersResults[i].status === 'fulfilled') {
          const user = usersResults[i].value[0];
          if (message.userId === user.id) {
            message.sender = user.username;
            senderFound = true;
            break;
          }
        }
      }

      if (!senderFound) {
        message.sender = "Deleted User";
      }

      delete message.userId;
      delete message.lobbyId;
      count += 1;
    })

    return Promise.resolve(messages);
  })
  .catch((err) => Promise.reject(err));
}

module.exports = {
  createGameMessage,
  createLobbyMessage,
  findGameMessages,
  findLobbyMessages
};