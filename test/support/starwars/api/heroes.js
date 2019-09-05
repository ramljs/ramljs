const characters = require('../../../support/starwars/data/characters');

module.exports = {
  spec: `
  type: { resourceCollection: { outputResource: Hero } }
  is: [ secured ]  
  `,

  /**
   *
   */
  get: [
    setTime,
    (req, res, next) => {
      res.json(characters);
      next();
    },
    logRequest
  ]

};

let id = 0;

function setTime(req, res, next) {
  req.time = new Date().toISOString();
  next();
}

function logRequest(req, res, next) {
  console.log('Request ' + req.id + ' completed');
  next();
}
