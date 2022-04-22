const baseURL = `${window.location.protocol}//${window.location.host}`;

function timeSince(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;

  if (interval > 1) {
    const year = Math.floor(interval);
    if (year == 1) return year + " year";
    return year + " years";
  }

  interval = seconds / 2592000;
  if (interval > 1) {
    const month = Math.floor(interval)
    if (month == 1) return month + " month";
    return month + " months";
  }

  interval = seconds / 86400;
  if (interval > 1) {
    const day = Math.floor(interval);
    if (day == 1) return day + " day";
    return day + " days";
  }

  interval = seconds / 3600;
  if (interval > 1) {
    const hour = Math.floor(interval);
    if (hour == 1) return hour + " hour";
    return hour + " hours";
  }

  interval = seconds / 60;
  if (interval > 1) {
    const minute = Math.floor(interval);
    if (minute == 1) return minute + " minute";
    return minute + " minutes";
  }

  const second = Math.floor(seconds);
  if (isNaN(second)) return "0 seconds";
  if (second == 1) return second + " second";
  return second + " seconds";
}

function addEventListenersToInvitations() {
  const invitationListItems = document.getElementsByClassName('invitation');
  for (const invitationListItem of invitationListItems) {
    const lobbyId = invitationListItem.id;
    const time = invitationListItem.getElementsByClassName('time-since').item(0);
    const acceptButton = invitationListItem.getElementsByClassName('accept').item(0);
    const declineButton = invitationListItem.getElementsByClassName('decline').item(0);

    time.innerHTML = timeSince(new Date(time.innerHTML));

    acceptButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      socket.emit('lobby-join', JSON.stringify({ lobbyId }));
    });

    declineButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      socket.emit('lobby-decline', JSON.stringify({ lobbyId }));
    });
  }
}

function createInvitation(invitation) {
  return (
    `<li id="${invitation.lobbyId}" class="invitation">
      <span>You were invited to "${invitation.lobbyName}" <time class="time-since">${timeSince(new Date(invitation.createdAt))}</time> ago...</span>
      <div>
        <button class="invitation-button decline">Decline</button>
        <button class="invitation-button accept">Accept</button>
      </div>
    </li>`
  );
}

function createEmptyInvitation() {
  return (
    `<li class="empty-invitation">
      It looks empty here...
    </li>`
  );
}

window.onload = function() {
  addEventListenersToInvitations();

  socket.on('update-notifications', (message) => {
    try {
      const data = JSON.parse(message);
      const invitationList = document.getElementById('notification-list');

      if (data.invitations) {
        invitationList.innerHTML = '';

        if (data.invitations.length > 0) {
          data.invitations.forEach((invitation) => {
            invitationList.innerHTML += createInvitation(invitation);
          })
        } else {
          invitationList.innerHTML = createEmptyInvitation();
        }

        addEventListenersToInvitations();
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('redirect', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.pathname) window.location.href = baseURL + data.pathname;
    } catch (err) {
      console.error(err);
    }
  });

  socket.emit('join-notifications-room', JSON.stringify({}));
}