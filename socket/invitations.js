function joinSocketInvitationRoom(socket, user) {
  if (user) {
    try {
      const referer = socket.handshake.headers.referer;
      if (referer) {
        const requestUrl = new URL(referer);
        const pathnameSplit = requestUrl.pathname.split('/');
        if (pathnameSplit.length === 2 && pathnameSplit[1] === 'notifications') {
          socket.join(`notification/${user.id}`)
        }
      }
    } catch (err) {
      console.error('Error occured when attempting to join socket notification room\n', err);
    }
  }
}

module.exports = { joinSocketInvitationRoom };