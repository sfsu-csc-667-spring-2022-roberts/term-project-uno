import timeSince from '../lib/timeSince.js';

function addEventListenersToInvitations() {
  const invitationListItems = document.getElementsByClassName('invitation');
  for (const invitationListItem of invitationListItems) {
    const lobbyId = invitationListItem.id;
    const time = invitationListItem.getElementsByClassName('time-since').item(0);
    const acceptButton = invitationListItem.getElementsByClassName('accept').item(0);
    const declineButton = invitationListItem.getElementsByClassName('decline').item(0);

    const date = new Date(time.getAttribute('datetime'));
    time.innerHTML = timeSince(date);
    setInterval(() => {
      time.innerHTML = timeSince(date);
    }, 1000);

    acceptButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      fetch(`/api/lobbies/${lobbyId}/invitations/accept`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      .then(async (res) => {
        if (res.redirected) {
          window.location.href = res.url;
        } else {
          const data = await res.json();
          if (data.message) createFlashMessage(data.message);
        }
      })
      .catch((err) => console.error(err));
    });

    declineButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      fetch(`/api/lobbies/${lobbyId}/invitations`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      .catch((err) => console.error(err));
    });
  }
}

function setFlashMessageFadeOut(flashElement) {
  flashElement.style.opacity = 0.9
  setTimeout(() => {
    let currentOpacity = 0.9;
    let timer = setInterval(() => {
      if (currentOpacity < 0.05) {
        clearInterval(timer);
        flashElement.remove();
      }
      currentOpacity *= 0.75;
      flashElement.style.opacity = currentOpacity;
    }, 50);
  }, 4000);
}

function createFlashMessage(message) {
  const flashMessageDiv = document.createElement('div');
  const innerFlashDiv = document.createElement('div');
  const innerTextNode = document.createTextNode(message);

  innerFlashDiv.append(innerTextNode);
  flashMessageDiv.append(innerFlashDiv);
  flashMessageDiv.setAttribute('id', 'flash-message');
  innerFlashDiv.setAttribute('class', 'alert');

  document.getElementsByTagName('body')[0].appendChild(flashMessageDiv);
  setFlashMessageFadeOut(flashMessageDiv);
}

function createInvitation(invitation) {
  return (
    `<li id="${invitation.lobbyId}" class="invitation">
      <span>You were invited to <p class="lobby-name">${invitation.lobbyName}</p> <time datetime="${invitation.createdAt}" class="time-since">${timeSince(invitation.createdAt)}</time> ago...</span>
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
          });
        } else {
          invitationList.innerHTML = createEmptyInvitation();
        }

        addEventListenersToInvitations();
      }
    } catch (err) {
      console.error(err);
    }
  });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      window.location.reload();
    }
  });
}