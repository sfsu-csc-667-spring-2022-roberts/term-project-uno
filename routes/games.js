const express = require('express');
const { authenticate } = require('../lib/utils/token');
const router = express.Router();

/* Create game */
router.post('/', authenticate, async (req, res) => {
    try {
        if (req.user) {
            const user = req.user;

            res.json({ message: "created"});
        } else res.status(401).json({ message: "Unauthorized" });
    } catch (err) {
        res.status(500).json({message: "Something went wrong"});
    }
});

const gameState = {
    players: [
        { id: 1, userID: 5, turnIndex: 1, username: "saggyballs", cards: 1, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
        { id: 2, userID: 1, turnIndex: 0, username: "iamfaisalh", cards: 7, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
        { id: 3, userID: 222, turnIndex: 2, username: "coolguy905", cards: 30, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
        { id: 4, userID: 319, turnIndex: 3, username: "joemomma", cards: 1, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
        { id: 5, userID: 401, turnIndex: 9, username: "horse666fivefive", cards: 1, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
        { id: 6, userID: 282, turnIndex: 4, username: "nike10", cards: 1, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
        { id: 7, userID: 808, turnIndex: 6, username: "tax", cards: 1, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
        { id: 8, userID: 913, turnIndex: 7, username: "king707", cards: 2, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
        { id: 9, userID: 300, turnIndex: 8, username: "glizzy", cards: 28, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
        { id: 10, userID: 552, turnIndex: 5, username: "flowerboy1", cards: 59, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
    ],
    playedDeck: [
        { id: 44, color: "red", value: 3, special: false },
        { id: 8, color: "yellow", value: 7, special: false },
        { id: 43, color: "blue", value: 7, special: false },
        { id: 56, color: "red", value: 4, special: false },
        { id: 1, color: "green", value: 0, special: false },
        { id: 840, color: "wild", value: "choose", special: true },
        { id: 849, color: "wild", value: "plus4choose", special: true },
        { id: 700, color: "green", value: "skip", special: true },
        { id: 56, color: "red", value: 1, special: false },
        { id: 720, color: "yellow", value: "plus2", special: true },
        { id: 740, color: "green", value: "reverse", special: true },
    ],
    mainDeck: [
        { id: 200, color: "green", value: 2, special: false },
        { id: 201, color: "yellow", value: 0, special: false },
        { id: 202, color: "red", value: 0, special: false },
        { id: 203, color: "red", value: 9, special: false },
        { id: 204, color: "green", value: 1, special: false },
        { id: 205, color: "blue", value: 6, special: false },
        { id: 206, color: "red", value: 3, special: false },
        { id: 207, color: "yellow", value: 7, special: false },
        { id: 208, color: "blue", value: 7, special: false },
        { id: 209, color: "red", value: 4, special: false },
        { id: 210, color: "green", value: 0, special: false },
        { id: 211, color: "blue", value: 2, special: false },
        { id: 212, color: "yellow", value: 0, special: false },
        { id: 213, color: "blue", value: 0, special: false },
        { id: 701, color: "red", value: "plus2", special: true },
        { id: 702, color: "green", value: "plus2", special: true },
        { id: 703, color: "blue", value: "plus2", special: true },
        { id: 711, color: "red", value: "skip", special: true },
        { id: 712, color: "yellow", value: "skip", special: true },
        { id: 713, color: "blue", value: "skip", special: true },
        { id: 842, color: "wild", value: "choose", special: true },
        { id: 841, color: "wild", value: "choose", special: true },
        { id: 740, color: "red", value: "reverse", special: true },
        { id: 740, color: "blue", value: "reverse", special: true },
        { id: 880, color: "wild", value: "plus4choose", special: true },
        { id: 881, color: "wild", value: "plus4choose", special: true },
    ],
    drawDeckCount: 50,
    turnIndex: 0,
    currentColor: "red",
    playerOrderReversed: false,
};

/* Get game state */
router.get('/:id', authenticate, async (req, res) => {
    try {
        if (req.user) {
            const user = req.user;
            gameState.players.sort((a, b) => a.turnIndex - b.turnIndex);
            const mainPlayer = gameState.players.find(p => p.userID === user.id);
            if (!mainPlayer) throw new Error("Unauthorized to join the game");
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
        } else res.status(401).json({ message: "Unauthorized" });
    } catch (err) {
        res.status(500).json({message: "Something went wrong"});
    }
});

/* Delete game */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        if (req.user) {
            const user = req.user;

            res.json({ message: "Left the game" });
        } else res.status(401).json({ message: "Unauthorized" });
    } catch (err) {
        res.status(500).json({message: "Something went wrong"});
    }
});

/* Leave game */
router.delete('/:id/players', authenticate, async (req, res) => {
    try {
        if (req.user) {
            const user = req.user;
            res.json({ message: "Left the game" });
        } else res.status(401).json({ message: "Unauthorized" });
    } catch (err) {
        res.status(500).json({message: "Something went wrong"});
    }
});

/* Play card */
router.patch('/:id/playCard', authenticate, async (req, res) => {
    try {
        if (req.user) {
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
        } else res.status(401).json({ message: "Unauthorized" });
    } catch (err) {
        res.status(500).json({message: "Something went wrong"});
    }
});

let idCount = 100;
/* Draw card */
router.patch('/:id/drawCard', authenticate, async (req, res) => {
    try {
        if (req.user) {
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
        } else res.status(401).json({ message: "Unauthorized" });
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
    if (req.user) {
        res.json({ messages });
    } else res.status(401).json({ message: "Unauthorized" });
});

/* Send message */
router.post('/:id/messages', authenticate, async (req, res) => {
    if (req.user) {
        const { message } = req.body;
        const newMessage = { id: count, sender: req.user.username, message: message, createdAt: new Date() };
        messages.push(newMessage);
        count++;
        res.json({ messages });
    } else res.status(401).json({ message: "Unauthorized" });
});

module.exports = router;
