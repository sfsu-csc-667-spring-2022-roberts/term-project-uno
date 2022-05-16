const express = require('express');
const GameError = require('../helpers/error/GameError');
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

const router = express.Router();

/* Create game */
router.post('/', authenticate, async (req, res) => {
  const NUM_STARTING_CARDS = 7;
  const hostId = req.user.id;
  const lobbyId = req.body.id;

  try {
    const lobby = await LobbyDao.findLobby(lobbyId);
    if (lobby.hostId != hostId) throw new GameError('Unauthorized: Not Lobby Host', 401);

    if (await GameDao.gameWithLobbyExists(lobbyId)) throw new GameError('Lobby is already in session', 400);

    const lobbyGuests = await LobbyGuestDao.findAllLobbyGuests(lobbyId);
    if (lobbyGuests.length === 0) throw new GameError('Mininum 2 Players', 400);

    lobbyGuests.forEach((lobbyGuest) => {
      if(lobbyGuest.userReady == false) { 
        throw new GameError("Not All Players are ready", 400);
      }
    })

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
    lobbyGuests.push({ 'userId': hostId });
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

    res.redirect(`/games/${game.id}`);
  } catch (err) {
    if (err instanceof GameError) return res.status(err.getStatus()).json({ message: err.getMessage() });
    console.error(err);
    res.status(500).json({ message: 'An unexpected error occured' });
  }
});

/* Get game state */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const gameState = await GameDao.findGameState(req.params.id, req.user.id);
    gameState.players.sort((a, b) => a.turnIndex - b.turnIndex);
    const mainPlayer = gameState.players.find(p => p.userID === user.id);
    if (!mainPlayer) throw new GameError("Unauthorized to join the game", 401);
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
    if (err instanceof GameError) return res.status(err.getStatus()).json({ message: err.getMessage() });
    console.error(err);
    res.status(500).json({message: "Something went wrong"});
  }
});

/* Delete game */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const user = req.user;
    res.json({ message: "Left the game" });
  } catch (err) {
    if (err instanceof GameError) return res.status(err.getStatus()).json({ message: err.getMessage() });
    console.error(err);
    res.status(500).json({message: "Something went wrong"});
  }
});

/* Leave game */
router.delete('/:id/players', authenticate, async (req, res) => {
  try {
    const user = req.user;
    res.json({ message: "Left the game" });
  } catch (err) {
    if (err instanceof GameError) return res.status(err.getStatus()).json({ message: err.getMessage() });
    console.error(err);
    res.status(500).json({message: "Something went wrong"});
  }
});

/* Play card */
router.patch('/:id/playCard', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const mainPlayer = gameState.players.find(p => p.userID === user.id);
    if (!mainPlayer) throw new GameError("Unauthorized to join the game", 401);
    if (mainPlayer.turnIndex !== gameState.turnIndex) throw new GameError("Unauthorized action, it is not your turn", 401);

    const id = parseInt(req.body.id);
    const card = gameState.mainDeck.find(c => c.id === id);
    gameState.mainDeck = gameState.mainDeck.filter(c => c !== card);
    gameState.playedDeck.push(card);
    gameState.players[0].cards = gameState.players[0].cards - 1;
    gameState.currentColor = card.color;
    // validate turn index
    if (gameState.playerOrderReversed) {
      if (gameState.turnIndex === 0) gameState.turnIndex = gameState.players.length - 1;
      else gameState.turnIndex = gameState.turnIndex - 1;
    } else {
      if (gameState.turnIndex === gameState.players.length - 1) gameState.turnIndex = 0;
      else gameState.turnIndex = gameState.turnIndex + 1;
    }
    res.json({ card, count: gameState.mainDeck.length, currentIndex: gameState.turnIndex ,success: true });
  } catch (err) {
    if (err instanceof GameError) return res.status(err.getStatus()).json({ message: err.getMessage() });
    console.error(err);
    res.status(500).json({message: "Something went wrong"});
  }
});

let idCount = 100;
/* Draw card */
router.patch('/:id/drawCard', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const mainPlayer = gameState.players.find(p => p.userID === user.id);
    if (!mainPlayer) throw new GameError("Unauthorized to join the game", 401);
    if (mainPlayer.turnIndex !== gameState.turnIndex) throw new GameError("Unauthorized action, it is not your turn", 401);
    const card = { id: idCount, color: "green", value: 2, special: false };
    idCount++;
    if (gameState.drawDeckCount <= 0) throw new Error();
    gameState.drawDeckCount = gameState.drawDeckCount - 1;
    gameState.mainDeck.push(card);
    gameState.players[0].cards = gameState.players[0].cards + 1;
    if (gameState.playerOrderReversed) {
      if (gameState.turnIndex === 0) gameState.turnIndex = gameState.players.length - 1;
      else gameState.turnIndex = gameState.turnIndex - 1;
    } else {
      if (gameState.turnIndex === gameState.players.length - 1) gameState.turnIndex = 0;
      else gameState.turnIndex = gameState.turnIndex + 1;
    }
    res.json({ card, count: gameState.mainDeck.length, currentIndex: gameState.turnIndex, success: true });
  } catch (err) {
    if (err instanceof GameError) return res.status(err.getStatus()).json({ message: err.getMessage() });
    console.error(err);
    res.status(500).json({message: "Something went wrong"});
  }
});

/* Get messages */
router.get('/:id/messages', authenticate, async (req, res) => {
  try {
    if (!PlayerDao.verifyUserInGame(req.params.id, req.user.id)) {
      return res.status(401).json({ message: 'User is not part of the game' });
    }
    res.json({ messages: await MessageDao.findGameMessages(req.params.id)});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

module.exports = router;
