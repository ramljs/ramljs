const characters = require('../../../../../support/starwars/data/characters');

module.exports = {

  spec: `
  get:
    description: List friends of hero
    body:
      application/json:
        type: Hero 
  `,

  methods: {
    get: (req, res) => {
      const {heroId} = req.params;
      const c = characters.find(x => String(x.id) === heroId);
      if (c) {
        const friends = c.friends.map(id => {
          return characters.find(x => String(x.id) === id);
        });
        return res.status(200).end(JSON.stringify(friends));
      }
      res.status(401).end('Not found');
    }
  }

};

