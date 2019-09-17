const characters = require('../../../../support/starwars/data/characters');

module.exports = {
  RAML: `
  uriParameters:
    heroId:
      type: integer
  type: { singleResource: { inputResource: Hero, outputResource: Hero } }
  is: [ secured ]    
  `,

  /**
   *
   */
  get: (req, res) => {
    const {heroId} = req.params;
    const c = characters.find(x => String(x.id) === heroId);
    if (c)
      return res.json(c);
    res.status(401).end('Not found');
  },

  /**
   *
   */
  post: (req, res) => {
    const data = req.body;
    data.id = req.params.heroId;
    characters.push(data);
    res.json(data);
  }

};

