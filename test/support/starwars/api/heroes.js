const characters = require('../../../support/starwars/data/characters');

module.exports = {

  spec: `
        get:
          body:
            application/json:
              type: Hero[]
          queryString:
            type: [paging,  lat-long | loc ]
            examples:
              first:
                value:
                  start: 2
                  lat: 12
                  long: 13
              second:
                value:
                  start: 2
                  page-size: 20
                  location: 1,2
              third:  # not valid
                value:
                  lat: 12
                  location: 2
                strict: false # because it's not valid    
  `,

  methods: [
    {
      all: (req, res, next) => {
        req.context.time = new Date().toISOString();
        next();
      }
    },
    {
      get: (req, res, next) => {
        res.status(200).end(JSON.stringify({
          requestTime: req.context.time,
          characters
        }));
        next();
      },
      all: (req, res, next) => {
        console.log();
      }
    }]

};
