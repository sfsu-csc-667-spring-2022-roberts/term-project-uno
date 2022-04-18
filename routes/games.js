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

const { authenticate } = require('../lib/utils/token');
const router = express.Router();

/* Create game */
router.post('/', authenticate, async (req, res) => {
  const NUM_STARTING_CARDS = 7;
  const hostId = req.user.id;
  const lobbyId = req.body.id;

  LobbyDao.findLobby(lobbyId)
  .then((lobby) => {
    if(lobby.hostId != hostId) throw new GameError("Unauthorized: Not Lobby Host", 401);
    return LobbyGuestDao.findAllLobbyGuests(lobbyId);
  })
  .then((lobbyGuests) => {
    if(lobbyGuests.length == 0) throw new GameError("Mininum 2 Players", 400);
    /*
    // Implement later
    lobbyGuests.forEach((lobbyGuest) => {
      if(lobbyGuest.userReady == false) { 
        throw new GameError("Not All Players are ready", 400);
      }
    })
    */
    return Promise.all([lobbyGuests, CardDao.getAllNormalCards(), CardDao.getAllSpecialCards()]);
  })  
  .then(async (results) => {
    const lobbyMembers = results[0];
    const normalCards = results[1];
    const specialCards = results[2];
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

    // Create full list of lobby members
    lobbyMembers.push({ "userId": hostId });
    // Shuffle list of lobby members
    const shuffledLobbyMembers = lobbyMembers.sort(() => Math.random() - 0.5);
    // Create a player out of each lobby member
    shuffledLobbyMembers.forEach((lobbyMember) => {
      createPlayers.push(PlayerDao.createPlayer(turnIndex, lobbyMember.userId, game.id));
      turnIndex += 1;
    });
    
    return Promise.all([
      PlayedCardDao.createPlayedCard(firstCard.id, game.id), Promise.all(createPlayers), shuffledCards, game]);
  })
  .then((results) => {
    const players = results[1];
    const shuffledCards = results[2];
    const game = results[3];
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

    return Promise.all([game, Promise.all(createPlayerCards), Promise.all(createDrawCards)]);
  })
  .then((results) => {
    const game = results[0];
    res.redirect(`/games/${game.id}`);
  })
  .catch((err) => {
    if (err instanceof GameError) return res.status(err.getStatus()).json({ message: err.getMessage() });
    console.error(err);
    res.status(500).json({ message: 'An unexpected error occured' });
  });
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
    res.status(500).json({message: "Something went wrong"});
  }
});

/* Leave game */
router.delete('/:id/players', authenticate, async (req, res) => {
  try {
    const user = req.user;
    res.json({ message: "Left the game" });
  } catch (err) {
    res.status(500).json({message: "Something went wrong"});
  }
});

/* Play card */
router.patch('/:id/playCard', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const mainPlayer = gameState.players.find(p => p.userID === user.id);
    if (!mainPlayer) throw new Error("Unauthorized to join the game");
    if (mainPlayer.turnIndex !== gameState.turnIndex) throw new Error("Unauthorized action, it is not your turn");

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
    res.status(500).json({message: "Something went wrong"});
  }
});

let idCount = 100;
/* Draw card */
router.patch('/:id/drawCard', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const mainPlayer = gameState.players.find(p => p.userID === user.id);
    if (!mainPlayer) throw new Error("Unauthorized to join the game");
    if (mainPlayer.turnIndex !== gameState.turnIndex) throw new Error("Unauthorized action, it is not your turn");
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
    res.status(500).json({message: "Something went wrong"});
  }
});

const messages = [
  { id: 1, sender: "snowpuff808", message: "You're trash, kys ", createdAt: new Date() },
  { id: 2, sender: "dawggydawg6969", message: "Look whose talking bruh, you have a whole ass 15 cards", createdAt: new Date() },
  { id: 3, sender: "snowpuff808", message: "Keep running your mouth, I'll be sure to place a +4 on your ass", createdAt: new Date() },
  { id: 4, sender: "dawggydawg6969", message: "and you eat ass... a ha ha", createdAt: new Date() },
  { id: 5, sender: "saggyballs", message: "Chill guys, relax...just play the game", createdAt: new Date() },
];
let count = 6;

/* Get messages */
router.get('/:id/messages', authenticate, async (req, res) => {
  res.json({ messages });
});

/* Send message */
router.post('/:id/messages', authenticate, async (req, res) => {
  const { message } = req.body;
  const newMessage = { id: count, sender: req.user.username, message: message, createdAt: new Date() };
  messages.push(newMessage);
  count++;
  res.json({ messages });
});

module.exports = router;
