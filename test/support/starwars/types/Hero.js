module.exports = {
  RAML: `
#%RAML 1.0 DataType
type: Human | Starwars.Jedi | Starwars.Droid
  `,

  description: 'A Hero in Starwars',
  typeOf: (t, v)=> {
    if (t.properties.side)
      return !!v.side;
    if (t.properties.model)
      return !!v.model;
  }
};
