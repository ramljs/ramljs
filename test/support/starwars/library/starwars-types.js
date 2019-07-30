module.exports = {
  spec: `
#%RAML 1.0 Library

annotationTypes:
  readonly: nil
  
types:

  ID:
    type: string
    required: true
    description: Idendity

  Gender:
    type: string
    enum: [male, female, other, unknown]

  Side:
    type: string
    description: Sides
    enum: [DARK, LIGHT]

  CharacterType:
    type: string
    description: Episodes in StarWars
    enum: [Human, Jedi, Droid]

  Character:
    properties:
      id:
        (readonly):
        type: ID                        
      type:
        type: CharacterType
        required: true
        description: Type of character
      name:
        type: string
        required: true
        description: Name of character
      friends:
        type: ID[]
        description: Friends of the character
      appearsIn:
        type: integer[]
        description: Which episode that character appears in

  PlanetResident:
    properties:
      homePlanet:
        type: string

  Human:
    type: [Character, PlanetResident]
    properties:
      gender:
        type: Gender
        default: unknown

  Alien:
    type: [Character, PlanetResident]

  Jedi:
    type: Human
    properties:
      side:
        type: Side

  Droid:
    type: Character
    properties:
      model:
        type: string
        required: true
        description: Model of the droid
      primaryFunction:
        type: string  
  `,

  types: {
    ID: {
      encode: (v) => {
        return v;
      },
      decode: (v) => {
        return v;
      }
    }
  }

};
