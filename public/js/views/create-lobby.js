const privateCheckBox = document.getElementById('private-checkbox');

if (privateCheckBox) {
  privateCheckBox.addEventListener('click', (event) => {
    if(privateCheckBox.checked == true) {
      const passwordInput = document.createElement('input');
      passwordInput.id = 'password-input';
      passwordInput.class = 'password-input';
      passwordInput.placeholder = "Password";
      passwordInput.required = true;
      
      document.getElementById('private-container').appendChild(passwordInput);
    } else {
      document.getElementById('private-container').removeChild(document.getElementById("password-input"));
    }
  });
}
