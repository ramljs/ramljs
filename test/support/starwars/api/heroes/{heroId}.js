const characters = require('../../../../support/starwars/data/characters');

module.exports = {

  spec: `
  uriParameters:
    heroId:
      type: integer
  get:
    body:
      application/json:
        type: Hero
  post:
    is: [ traceable ]
    body:
      application/json:
        type: Hero
  `,

  /**
   *
   */
  get: (req, res) => {
    const {heroId} = req.params;
    const c = characters.find(x => String(x.id) === heroId);
    if (c)
      return res.status(200).end(JSON.stringify(c));
    res.status(401).end('Not found');
  },

  /**
   *
   */
  post: () => {},

  pathSecurity: (req, scope) => {

  }

};

