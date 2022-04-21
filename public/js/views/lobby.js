const socket = io();
const kickColumns = document.getElementsByClassName('lobby-guest-kick')

async function start(lobbyId) {
  const url = window.location.protocol + '//' + window.location.host;

  fetch(url + '/api/games/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({id: lobbyId}),
  })
  .then(async (res) => {
    if (res.redirected) {
      window.location.href = res.url;
    }
  })
  .catch((err) => {
    console.error(err);
  });
}

if (kickColumns) {
  for (let col of kickColumns) {
    console.log(col.children[0]);
  }
}

/*
  <tr class="lobby-guest">
    <td class="lobby-guest-icon-col">
      <div class="lobby-guest-icon">
        {{#if user.pictureUrl}}
        <img src="{{user.pictureUrl}}">
        {{else}}
        <img src="/images/default-profile-pic.png">
        {{/if}}
      </div>
    </td>
    <td class="lobby-guest-name">stephenjusto24444</td>
    <td class="lobby-guest-status">Not Ready</td>
    <td>
    </td>
  </tr>

  <tr class="lobby-guest">
    <td class="lobby-guest-icon-col">
      <div class="lobby-guest-icon">
        {{#if user.pictureUrl}}
        <img src="{{user.pictureUrl}}">
        {{else}}
        <img src="/images/default-profile-pic.png">
        {{/if}}
      </div>
    </td>
    <td class="lobby-guest-name">stephenjusto24444</td>
    <td class="lobby-guest-status">Host</td>
    <td>
    </td>
  </tr>
*/