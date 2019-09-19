module.exports = {
  raml: `
#%RAML 1.0 DataType
type: Human | Jedi | Droid
  `,

  description: 'A Hero in Starwars',
  typeOf: (t, v) => {
    if (t.properties.side)
      return !!v.side;
    if (t.properties.model)
      return !!v.model;
  }
};
