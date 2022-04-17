const express = require('express');
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

const NUM_STARTING_CARDS = 7;

/* Create game */
router.post('/', authenticate, async (req, res) => {
    try {
        const hostId = req.user.id;
        const lobbyId = req.body.id;
        let players;
        let availableCards = [];
        let firstCard;
        let gameId;

        LobbyDao.findLobby(lobbyId)
        .then((result) => {
            if(result[0].hostId != hostId)
            {
                return res.status(401).json({message: "Unauthorized: Not Lobby Host"});
            }
            LobbyGuestDao.getAllLobbyGuests(lobbyId)
            .then((results) => {
                if(results.length <= 1) {
                    return res.status(400).json({message: "Mininum 2 Players"});
                }
                for(let i=0;i<results.length;i++) {
                    // if(results[i].userReady == false) { (to do later)
                    //     return res.status(401).json({message: "Not All Players are ready."});
                    // }
                }
                players = results;
                CardDao.getAllNormalCards()
                .then((results) => {
                    availableCards = results;
                    console.log("Add Normal",availableCards.length);
                    const randomIndex = Math.floor(Math.random()*availableCards.length);
                    firstCard = availableCards[randomIndex];
                    return CardDao.getAllSpecialCards()
                })
                .then((results) => {
                    for(let i=0; i<results.length;i++) {
                        availableCards.push(results[i]);
                    }
                    console.log("Add Special", availableCards.length);
                    return GameDao.createGame(firstCard.color, lobbyId);
                })
                .then(async (result) => {
                    gameId = result.id;
                    await PlayedCardDao.createPlayedCard(firstCard.id, result.id)
                    .then(async (result) => {
                        // console.log(firstCard);
                        const cardIndex = availableCards.indexOf(firstCard);
                        const removedCard = availableCards.splice(cardIndex, 1)[0];
                        // console.log(removedCard);
                        console.log("Initial Card Placed", availableCards.length);
                        if(removedCard.id != result.cardId) {
                            return res.status(500).json({message: "Something went wrong"});
                        }
                        turnIndex = 0;
                        const host = {"userId":hostId};
                        players.push(host);
                        // console.log("Normal",players);
                        players = players.sort(() => Math.random() - 0.5)
                        // console.log("Randomized",players);
                        for(let i=0; i<players.length;i++) {
                            await PlayerDao.createPlayer(turnIndex, players[i].userId, gameId)
                            .then(async (result) => {
                                for(let k=0; k<NUM_STARTING_CARDS; k++) {
                                    const randomIndex = Math.floor(Math.random()*availableCards.length);
                                    // console.log("BEFORE CREATE", availableCards[randomIndex]);
                                    await PlayerCardDao.createPlayerCard(availableCards[randomIndex].id, result.id)
                                    .then((result) => {
                                        const removedCard = availableCards.splice(randomIndex, 1)[0];
                                        // console.log("REMOVED", removedCard);
                                    })
                                    .catch((err) => {
                                        console.error("ERROR",err);
                                        res.status(500).json({ message: 'An unexpected error occured' });
                                    }); 
                                }
                            })
                            .catch((err) => {
                                console.error("ERROR",err);
                                res.status(500).json({ message: 'An unexpected error occured' });
                            }); 
                            turnIndex++
                        }
                        console.log("After Player Initial Cards", availableCards.length);
                        while(availableCards.length>0) {
                            // console.log(availableCards.length);
                            const randomIndex = Math.floor(Math.random()*availableCards.length);
                            // console.log("BEFORE CREATE", availableCards[randomIndex]);
                            await DrawCardDao.createDrawCard(availableCards[randomIndex].id, gameId)
                            .then((result) => {
                                const removedCard = availableCards.splice(randomIndex, 1)[0];
                                // console.log("REMOVED", removedCard);
                                if(availableCards.length == 0) {
                                    // console.log("HERE");
                                    //set lobby to busy (do later)
                                    res.redirect("/games/"+gameId);
                                }
                            })
                            .catch((err) => {
                                console.error("ERROR",err);
                                res.status(500).json({ message: 'An unexpected error occured' });
                            }); 
                        }
                    })
                })
                .catch((err) => {
                    console.error("ERROR",err);
                    res.status(500).json({ message: 'An unexpected error occured' });
                }); 
            })
            .catch((err) => {
                console.error("ERROR",err);
                res.status(500).json({ message: 'An unexpected error occured' });
            });     
        })
        .catch((err) => {
            console.error("ERROR",err);
            res.status(500).json({ message: 'An unexpected error occured' });
        });
    } catch (err) {
        res.status(500).json({message: "Something went wrong"});
    }
});

/* Get game state */
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

            res.json({ gameState });
        } else res.status(401).json({ message: "Unauthorized" });
    } catch (err) {
        res.status(500).json({message: "Something went wrong"});
    }
});

/* Draw card */
router.patch('/:id/drawCard', authenticate, async (req, res) => {
    try {
        if (req.user) {
            const user = req.user;

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
