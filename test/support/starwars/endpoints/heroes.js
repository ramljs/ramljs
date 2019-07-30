const characters = require('../../../support/starwars/data/characters');

module.exports = {

  spec: `
        get:
          body:
            application/json:
              type: Hero[]
  `,

  methods: {
    get: (req, res) => {
      res.status(200).end(JSON.stringify(characters));
    }
  },

  securityHandler: (req, scopes) => {
  }

};
