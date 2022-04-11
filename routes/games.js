const express = require('express');
const { authenticate } = require('../lib/utils/token');
const router = express.Router();

/* Get game */
router.get('/:id', authenticate, async (req, res) => {
    try {
        if (req.user) {
            const user = req.user;
            const gameState = {
                players: [
                    { id: 1, userID: 521, turnIndex: 4, username: "saggyballs", cards: 7, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
                    { id: 2, userID: user.id, turnIndex: 7, username: user.username, cards: 2, avatar: user.pictureUrl },
                    { id: 3, userID: 222, turnIndex: 6, username: "coolguy905", cards: 10, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
                    { id: 4, userID: 319, turnIndex: 1, username: "joemomma", cards: 29, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
                    { id: 5, userID: 401, turnIndex: 5, username: "horse666fivefive", cards: 29, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
                    { id: 6, userID: 282, turnIndex: 3, username: "nike10", cards: 29, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
                    { id: 7, userID: 808, turnIndex: 8, username: "tax", cards: 1, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
                    { id: 8, userID: 913, turnIndex: 2, username: "king707", cards: 2, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
                    { id: 9, userID: 121, turnIndex: 0, username: "glizzy", cards: 32, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
                    { id: 10, userID: 552, turnIndex: 9, username: "flowerboy1", cards: 59, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
                ],
                playedDeck: [
                    { id: 44, color: "red", value: 3, special: false },
                    { id: 8, color: "yellow", value: 7, special: false },
                    { id: 43, color: "blue", value: 7, special: false },
                    { id: 56, color: "red", value: 4, special: false },
                    { id: 1, color: "green", value: 0, special: false },
                    { id: 38, color: "yellow", value: 6, special: false },
                ],
                mainDeck: [
                    { id: 72, color: "green", value: 2, special: false },
                    { id: 99, color: "yellow", value: 0, special: false },
                    { id: 49, color: "red", value: 0, special: false },
                    { id: 88, color: "red", value: 9, special: false },
                    { id: 19, color: "green", value: 1, special: false },
                    { id: 32, color: "blue", value: 6, special: false },
                    { id: 44, color: "red", value: 3, special: false },
                    { id: 8, color: "yellow", value: 7, special: false },
                    { id: 43, color: "blue", value: 7, special: false },
                    { id: 56, color: "red", value: 4, special: false },
                    { id: 1, color: "green", value: 0, special: false },
                    { id: 72, color: "blue", value: 2, special: false },
                    { id: 99, color: "yellow", value: 0, special: false },
                    { id: 49, color: "blue", value: 0, special: false },
                ],
                drawDeckCount: 12,
                turnIndex: 0,
                currentColor: "red",
                playerOrderReversed: false,
            };

            gameState.players.sort((a, b) => a.turnIndex - b.turnIndex);
            const mainPlayer = gameState.players.find(p => p.userID === user.id);
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

const messages = [
    { id: 1, sender: "snowpuff808", message: "You're trash, kys ", createdAt: new Date() },
    { id: 2, sender: "dawggydawg6969", message: "Look whose talking bruh, you have a whole ass 15 cards", createdAt: new Date() },
    { id: 3, sender: "snowpuff808", message: "Keep running your mouth, I'll be sure to place a +4 on your ass", createdAt: new Date() },
    { id: 4, sender: "dawggydawg6969", message: "and you eat ass... a ha ha", createdAt: new Date() },
    { id: 5, sender: "saggyballs", message: "Chill guys, relax...just play the game", createdAt: new Date() },
];
let count = 6;

router.get('/:id/messages', authenticate, async (req, res) => {
    if (req.user) {
        res.json({ messages });
    } else res.status(401).json({ message: "Unauthorized" });
});

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
