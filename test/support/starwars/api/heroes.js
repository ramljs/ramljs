const characters = require('../../../support/starwars/data/characters');

module.exports = {
  spec: `
  get:
    queryString:
      # type: number
      type: paging
    responses:
      200:
        body:
          application/json:
            type: Hero[]                     
  post:
    body:
      application/json:
        type: Hero
  `,

  get: [
    setTime,
    (req, res, next) => {
      res.status(200).end(JSON.stringify({
        requestTime: req.time,
        characters
      }));
      next();
    },
    logRequest
  ],

  post: [
    setTime,
    (req, res, next) => {
      console.log(req.body);
      res.status(200).json(req.body);
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
