const socket = io();
const navProfilePic = document.getElementById('nav-profile-pic');
const logout = document.getElementById('logout');
const searchForm = document.getElementById('search-form')
const notificationIcon = document.getElementById('notifications-icon');

if (navProfilePic) {
  navProfilePic.addEventListener('click', (event) => {
    const element = document.querySelector('#profile-dropdown');
    const removeClickListener = () => {
      document.removeEventListener('click', outsideClickListener);
    }
    const outsideClickListener = (e) => {
      if (!element.contains(e.target) && element.classList.contains('dropdown-menu-visible')) {
        element.setAttribute('class', 'dropdown-menu');
        removeClickListener();
      }
    }
    
    event.stopPropagation();
    document.addEventListener('click', outsideClickListener);
    element.setAttribute('class', 'dropdown-menu-visible');
  });
}

if (logout) {
  logout.addEventListener('click', (event) => {
    const url = window.location.protocol + '//' + window.location.host;
    fetch(url + '/api/users/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(async (res) => {
      window.location.href = url + '/login';
    })
    .catch((err) => {
      console.error(err);
    })
  });
}

if (searchForm) {
  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      const url = new URL(`${window.location.protocol}//${window.location.host}/search`);
      url.searchParams.set('q', searchInput.value);
      window.location = url.href;
    }
  })
}

socket.on('notification', (message) => {
  try {
    const data = JSON.parse(message);

    if (notificationIcon && notificationIcon.src) {
      if (data.invitations && data.invitations.length > 0) {
        notificationIcon.src = '/images/notifications-signal.png';
      } else {
        notificationIcon.src = '/images/notifications.png';
      }
    }
  } catch (err) {
    console.error(err);
  }
})
