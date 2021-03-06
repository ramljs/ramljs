const characters = require('../../../../../support/starwars/data/characters');

module.exports = {
  raml: `
  get:
    description: List friends of hero
    queryParameters:
      limit:
        type: integer
    body:
      application/json:
        type: Hero 
    responses:
      200:
        body:
          application/json:
            type: Hero[]                   
  `,

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

};

