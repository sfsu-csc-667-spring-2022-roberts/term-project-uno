class LobbyError extends Error {
  constructor(message, status, redirectUrl) {
    super(message);
    this.status = status;
    this.redirectUrl = redirectUrl;
  }

  getMessage() {
    return this.message;
  }

  getStatus() {
    return this.status;
  }

  getRedirectUrl() {
    return this.redirectUrl;
  }
}

module.exports = LobbyError;