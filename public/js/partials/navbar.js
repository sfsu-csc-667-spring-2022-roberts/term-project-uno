const navProfilePic = document.getElementById('nav-profile-pic');
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

const logout = document.getElementById('logout');
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
