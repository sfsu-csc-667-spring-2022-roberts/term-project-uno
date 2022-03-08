require('dotenv').config();

module.exports = {
  "development": {
    "use_env_variable": "DATABASE_URL",
    "dialect": "postgres",
    "dialectOptions": {
      "ssl": {
        "ssl": true,
        "rejectUnauthorized": false
      }
    }
  },
  "test": {
    "use_env_variable": "DATABASE_URL",
    "dialect": "postgres",
    "dialectOptions": {
      "ssl": {
        "ssl": true,
        "rejectUnauthorized": false
      }
    }
  },
  "production": {
    "use_env_variable": "DATABASE_URL",
    "dialect": "postgres",
    "dialectOptions": {
      "ssl": {
        "ssl": true,
        "rejectUnauthorized": false
      }
    }
  }
}
