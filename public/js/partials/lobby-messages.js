const messages = document.getElementById('messages');
const messageInput = document.getElementById('message-input');

function sendMessage() {
  if (messageInput.value.trim().length > 0) {   
    fetch(`/api/lobbies/${lobbyId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: messageInput.value })
    })
    .then(async (res) => {
      const data = await res.json();
      if (res.status != 201 && data.message) {
      }
    })
    .catch((err) => console.error(err))
    .finally(() => {
      messageInput.value = '';
    });
  }
}

function createMessage(message) {
  return (
    `<div id="${message.id ? message.id : ''}" class="message-container">
      ${message.sender ? `<strong class="message-sender">${message.sender}</strong>` : ''}
      <div class="message ${message.notification ? 'notification' : ''}">${message.message}</div>
      <span class="message-time">${timeFormat(new Date(message.createdAt).toLocaleTimeString().split(":"))}</span>
    </div>`
  );
}

function appendMessage(message) {
  messages.innerHTML = messages.innerHTML + createMessage(message);
  messages.scrollTop = messages.scrollHeight;
}

function timeFormat(time) {
  return `${time[0]}:${time[1]} ${time[2].split(" ")[1]}`;
}

function initMessages() {
  socket.on('lobby-message-send', (message) => {
    try {
      const data = JSON.parse(message);
      console.log(data);
      appendMessage(data);
    } catch (err) {
      console.error(err);
    }
  });

  fetch(`/api/lobbies/${lobbyId}/messages`)
  .then(response => response.json())
  .then((data) => {
    if (data.messages) {
      console.log(data.messages);
      messages.innerHTML = '';
      data.messages.forEach((message) => {
        messages.innerHTML = messages.innerHTML + createMessage(message);
      })
    }
  })
  .catch((err) => console.error(err))
  .finally(() => {
    messages.scrollTop = messages.scrollHeight;
  });

  messageInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  });
}