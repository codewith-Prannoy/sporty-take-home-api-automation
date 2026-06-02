const namedApiResourceSchema = {
  type: 'object',
  required: ['name', 'url'],
  properties: {
    name: { type: 'string', minLength: 1 },
    url: { type: 'string', format: 'uri' }
  },
  additionalProperties: true
};

const pokemonDetailSchema = {
  type: 'object',
  required: [
    'id',
    'name',
    'height',
    'weight',
    'base_experience',
    'order',
    'abilities',
    'forms',
    'moves',
    'species',
    'sprites',
    'stats',
    'types'
  ],
  properties: {
    id: { type: 'integer', minimum: 1 },
    name: { type: 'string', minLength: 1 },
    height: { type: 'integer', minimum: 1 },
    weight: { type: 'integer', minimum: 1 },
    base_experience: { type: 'integer', minimum: 1 },
    order: { type: 'integer', minimum: 1 },
    abilities: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['ability', 'is_hidden', 'slot'],
        properties: {
          ability: namedApiResourceSchema,
          is_hidden: { type: 'boolean' },
          slot: { type: 'integer', minimum: 1 }
        },
        additionalProperties: true
      }
    },
    forms: {
      type: 'array',
      minItems: 1,
      items: namedApiResourceSchema
    },
    moves: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['move', 'version_group_details'],
        properties: {
          move: namedApiResourceSchema,
          version_group_details: { type: 'array' }
        },
        additionalProperties: true
      }
    },
    species: namedApiResourceSchema,
    sprites: {
      type: 'object',
      required: ['front_default'],
      properties: {
        front_default: { type: 'string', format: 'uri' },
        front_shiny: { type: ['string', 'null'], format: 'uri' }
      },
      additionalProperties: true
    },
    stats: {
      type: 'array',
      minItems: 6,
      items: {
        type: 'object',
        required: ['base_stat', 'effort', 'stat'],
        properties: {
          base_stat: { type: 'integer', minimum: 1 },
          effort: { type: 'integer', minimum: 0 },
          stat: namedApiResourceSchema
        },
        additionalProperties: true
      }
    },
    types: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['slot', 'type'],
        properties: {
          slot: { type: 'integer', minimum: 1 },
          type: namedApiResourceSchema
        },
        additionalProperties: true
      }
    }
  },
  additionalProperties: true
};

const pokemonListSchema = {
  type: 'object',
  required: ['count', 'next', 'previous', 'results'],
  properties: {
    count: { type: 'integer', minimum: 1 },
    next: { type: ['string', 'null'], format: 'uri' },
    previous: { type: ['string', 'null'], format: 'uri' },
    results: {
      type: 'array',
      items: namedApiResourceSchema
    }
  },
  additionalProperties: false
};

const pokemonTypeSchema = {
  type: 'object',
  required: ['id', 'name', 'damage_relations', 'pokemon'],
  properties: {
    id: { type: 'integer', minimum: 1 },
    name: { type: 'string', minLength: 1 },
    damage_relations: {
      type: 'object',
      required: [
        'double_damage_from',
        'double_damage_to',
        'half_damage_from',
        'half_damage_to',
        'no_damage_from',
        'no_damage_to'
      ],
      properties: {
        double_damage_from: { type: 'array', items: namedApiResourceSchema },
        double_damage_to: { type: 'array', items: namedApiResourceSchema },
        half_damage_from: { type: 'array', items: namedApiResourceSchema },
        half_damage_to: { type: 'array', items: namedApiResourceSchema },
        no_damage_from: { type: 'array', items: namedApiResourceSchema },
        no_damage_to: { type: 'array', items: namedApiResourceSchema }
      },
      additionalProperties: true
    },
    pokemon: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['pokemon', 'slot'],
        properties: {
          pokemon: namedApiResourceSchema,
          slot: { type: 'integer', minimum: 1 }
        },
        additionalProperties: true
      }
    }
  },
  additionalProperties: true
};

module.exports = {
  pokemonDetailSchema,
  pokemonListSchema,
  pokemonTypeSchema
};
