function splitLobbyMembers(lobbyMembers) {
  const leftList = [];
  const rightList = [];
  const emptyGuest = { empty: true };

  for (let i = 0; i < 5; i++) {
    if (i < lobbyMembers.length) {
      leftList.push(lobbyMembers[i]);
    } else leftList.push(emptyGuest);
  }

  for (let i = 0; i < 5; i++) {
    if (i + 5 < lobbyMembers.length) {
      rightList.push(lobbyMembers[i + 5]);
    } else rightList.push(emptyGuest);
  }

  return { leftList, rightList };
}

module.exports = {
  splitLobbyMembers
};
