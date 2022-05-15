const express = require('express');
const GameError = require('../helpers/error/GameError');
const UserDao = require('../db/dao/users');
const CardDao = require('../db/dao/cards');
const LobbyDao = require('../db/dao/lobbies');
const LobbyGuestDao = require('../db/dao/lobbyGuests');
const GameDao = require('../db/dao/games');
const PlayedCardDao = require('../db/dao/playedCards')
const PlayerDao = require('../db/dao/players');
const PlayerCardDao = require('../db/dao/playerCards')
const DrawCardDao = require('../db/dao/drawCards');
const MessageDao = require('../db/dao/messages');
const { authenticate } = require('../lib/utils/token');
const { getSocketsFromUserSockets } = require('../lib/utils/socket');
const { emitBasedOnCardType, emitDrawCards } = require('../lib/utils/socket');

const io = require('../socket/index');

const router = express.Router();

/* Create game */
router.post('/', authenticate, async (req, res) => {
  const NUM_STARTING_CARDS = 7;
  const { lobbyId } = req.body;

  try {
    if (!(await LobbyDao.verifyHost(req.user.id, lobbyId))) {
      return res.status(401).json({ message: 'You must be the host to start the game' });
    }
    if (await GameDao.gameWithLobbyExists(lobbyId)) {
      return res.status(409).json({ message: 'Lobby is already in a game session' });
    }

    const lobbyGuests = await LobbyGuestDao.findAllLobbyGuests(lobbyId);
    if (lobbyGuests.length === 0) {
      return res.status(409).json({ message: 'Minimum of 2 players needed to start game' });
    }

    for (let i = 0; i < lobbyGuests.length; i++) {
      if (lobbyGuests[i].userReady === false) {
        return res.status(401).json({ message: 'Not all players are ready' });
      }
    }

    const cards = await Promise.all([CardDao.getAllNormalCards(), CardDao.getAllSpecialCards()]);
    const normalCards = cards[0];
    const specialCards = cards[1];
    const createPlayers = [];
    let turnIndex = 0;

    // Randomly pick the first card on the played stack
    const randomIndex = Math.floor(Math.random() * normalCards.length);
    const firstCard = normalCards[randomIndex];
    normalCards.splice(randomIndex, 1);

    // Combine normal cards + special cards
    const allCards = normalCards.concat(specialCards);
    // Shuffle cards
    const shuffledCards = allCards.sort(() => Math.random() - 0.5);
    // Create game
    const game = await GameDao.createGame(firstCard.color, lobbyId);
    LobbyDao.setBusy(lobbyId, true);

    // Create full list of lobby members and shuffle
    lobbyGuests.push({ 'userId': req.user.id });
    const shuffledLobbyMembers = lobbyGuests.sort(() => Math.random() - 0.5);
    // Create a player out of each lobby member
    shuffledLobbyMembers.forEach((lobbyMember) => {
      createPlayers.push(PlayerDao.createPlayer(turnIndex, lobbyMember.userId, game.id));
      turnIndex += 1;
    });

    const createdEntities = await Promise.all([
      PlayedCardDao.createPlayedCard(firstCard.id, game.id), Promise.all(createPlayers)
    ]);
    const players = createdEntities[1];
    const createPlayerCards = [];
    const createDrawCards = [];
    let shuffledCardsIdx = 0;

    // Give each player 7 cards
    players.forEach((player) => {
      for (let i = 0; i < NUM_STARTING_CARDS; i++) {
        createPlayerCards.push(PlayerCardDao.createPlayerCard(shuffledCards[shuffledCardsIdx].id, player.id));
        shuffledCardsIdx += 1;
      }
    });

    // Create the draw stack
    for (let i = shuffledCardsIdx; i < shuffledCards.length; i++) {
      const card = shuffledCards[i];
      createDrawCards.push(DrawCardDao.createDrawCard(card.id, game.id));
    }

    await Promise.all([Promise.all(createPlayerCards), Promise.all(createDrawCards)]);

    io.to(`lobby/${lobbyId}`).emit('redirect', JSON.stringify({ pathname: `/games/${game.id}` }));
    res.status(201).json({ message: 'Game successfully started' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'An unexpected error occured' });
  }
});

/* Get game state */
router.get('/:gameId(\\d+)', authenticate, async (req, res) => {
  const { gameId } = req.params;
  try {
    if (!(await PlayerDao.verifyUserInGame(gameId, req.user.id))) {
      return res.status(401).json({ message: 'You are not a player in the game' });
    }

    const gameState = await GameDao.findGameState(gameId, req.user.id);
    gameState.players.sort((a, b) => a.turnIndex - b.turnIndex);

    const mainPlayer = gameState.players.find(p => p.userID === req.user.id);
    if (!mainPlayer) {
      return res.status(500).json({ message: 'Something went wrong' });
    }

    const mainPlayerIndex = gameState.players.indexOf(mainPlayer);
    const players = [mainPlayer];
    for (let i = mainPlayerIndex; i < gameState.players.length; i++) {
      if (i !== mainPlayerIndex) players.push(gameState.players[i])
    }
    for (let i = 0; i < mainPlayerIndex; i++) {
      if (i !== mainPlayerIndex) players.push(gameState.players[i])
    }
    gameState.players = players;

    res.json({ gameState });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'An unexpected error occured' });
  }
});

/* Leave game */
router.delete('/:gameId(\\d+)/players', authenticate, async (req, res) => {
  const { gameId } = req.params;
  try {
    const game = await GameDao.findGame(gameId);
    if (!game) return res.status(404).json({ message: 'Game not found' });

    if (!(await PlayerDao.verifyUserInGame(gameId, req.user.id))) {
      return res.status(401).json({ message: 'You are not a player in the game' });
    }

    const lobby = await LobbyDao.findLobby(game.lobbyId);

    // If user isn't the host then simply remove them from the guest list
    if (req.user.id != lobby.hostId) {
      await Promise.all([
        PlayerDao.remove(req.user.id, gameId),
        UserDao.addLoss(req.user.id),
        LobbyGuestDao.remove(req.user.id, lobby.id)
      ]);
    } else {
      // If the host is leaving the game, we must assign a new host to the lobby!
      const nextHostId = await LobbyGuestDao.removeOldestGuest(lobby.id);
      await Promise.all([
        PlayerDao.remove(req.user.id, gameId),
        UserDao.addLoss(req.user.id),
        LobbyDao.setHost(nextHostId, lobby.id)
      ]);
    }

    const players = await PlayerDao.findPlayersByGameId(gameId);

    if (players.length == 1) { // declare remaining player as the winner & end game!
      const lastPlayer = players[0];
      await Promise.all([
        UserDao.addWin(lastPlayer.userId),
        GameDao.deleteGame(gameId),
        PlayerDao.remove(lastPlayer.userId, gameId),
        LobbyDao.setBusy(lobby.id, false)
      ]);
    }

    res.json({ message: 'Successfully left the game' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

/* Play card */
router.patch('/:id/playCard', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const gameId = parseInt(req.params.id);
    const cardId = parseInt(req.body.cardId);
    const chosenColor = req.body.chosenColor;
    const player2username = req.body.player2;

    if (!user || !(await PlayerDao.verifyUserInGame(gameId, user.id))) throw new GameError("Unauthorized: you are not in this game", 401);

    const players = await PlayerDao.findPlayers(user.id);

    // if findPlayers does not return 1, or the player does not actually have the card, --> return
    if (players.length !== 1 || !(await PlayerCardDao.verifyPlayerCard(cardId, players[0].id))) throw new GameError("Bad request", 400);

    const card = await CardDao.getCard(cardId);
    const topOfPlayedCardsResult = await PlayedCardDao.findTopOfPlayedCards(gameId);
    const topOfPlayedCards = await CardDao.getCard(topOfPlayedCardsResult.cardId);
    const game = await GameDao.findGame(gameId);

    if (!card || !topOfPlayedCardsResult || !topOfPlayedCards || !game) throw new GameError("Something went wrong", 500);

    // if it is not the player's turn, or (the current color is not equal to the card's color, and 
    // the card value is not the same as the one at the top of the played cards, and the card is not a wild card) --> return
    if (game.turnIndex !== players[0].turnIndex || (game.currentColor !== card.color && card.value !== topOfPlayedCards.value && card.color !== "wild")) {
      throw new GameError("Bad request: wrong move", 400);
    }
    players[0].username = user.username;

    emitBasedOnCardType(game, players[0], card, io, chosenColor, player2username);

    res.json({ message: "Processing play card action", status: 200 });
  } catch (err) {
    if (err instanceof GameError) return res.status(err.getStatus()).json({ message: err.getMessage() });
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

/* Draw card */
router.patch('/:id/drawCard', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const gameId = parseInt(req.params.id);

    if (!user || !(await PlayerDao.verifyUserInGame(gameId, user.id))) throw new GameError("Unauthorized: you are not in this game", 401);

    const players = await PlayerDao.findPlayers(user.id);
    const game = await GameDao.findGame(gameId);

    if (players.length !== 1 || !game || game.turnIndex !== players[0].turnIndex) throw new GameError("Bad request: wrong move", 400);
    
    emitDrawCards(game, players[0], io);

    res.json({ message: "Processing card draw action", status: 200 });
  } catch (err) {
    if (err instanceof GameError) return res.status(err.getStatus()).json({ message: err.getMessage() });
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

/* Get Cards */
router.get('/:id/getCards', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const gameId = parseInt(req.params.id);

    if (!user || !(await PlayerDao.verifyUserInGame(gameId, user.id))) throw new GameError("Unauthorized: you are not in this game", 401);

    const players = await PlayerDao.findPlayers(user.id);
    const cards = await PlayerCardDao.findPlayerCards(players[0].id);

    if (players.length !== 1 || !cards) throw new GameError("Bad request", 400);
    
    res.json({ cards });

  } catch (err) {
    if (err instanceof GameError) return res.status(err.getStatus()).json({ message: err.getMessage() });
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

/* Get Usernames */
router.get('/:id/players', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const gameId = parseInt(req.params.id);

    if (!user || !(await PlayerDao.verifyUserInGame(gameId, user.id))) throw new GameError("Unauthorized: you are not in this game", 401);

    let usernames = await GameDao.findUsernamesInGame(gameId);
    usernames = usernames.map(u => u.username)
    usernames = usernames.filter(u => u !== user.username)

    if (!usernames) throw new GameError("Bad request", 400);
    
    res.json({ usernames });

  } catch (err) {
    if (err instanceof GameError) return res.status(err.getStatus()).json({ message: err.getMessage() });
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

/* Get messages */
router.get('/:id/messages', authenticate, async (req, res) => {
  try {
    if (!PlayerDao.verifyUserInGame(req.params.id, req.user.id)) {
      return res.status(401).json({ message: 'User is not part of the game' });
    }
    res.json({ messages: await MessageDao.findGameMessages(req.params.id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

/* Send game messasge */
router.post('/:gameId(\\d+)/messages', authenticate, async (req, res) => {
  const { gameId } = req.params;
  const { message } = req.body;

  try {
    if (!(await PlayerDao.verifyUserInGame(gameId, req.user.id))) {
      return res.status(401).json({ message: 'You are not a player in the game' });
    }

    const messageObj = await MessageDao.createGameMessage(message, req.user.id, gameId);

    messageObj.sender = req.user.username;
    delete messageObj.userId;
    delete messageObj.gameId;

    io.to(`game/${gameId}`).emit('game-message-send', messageObj);

    res.status(201).json({ message: 'Successfully created new game message' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

module.exports = router;
