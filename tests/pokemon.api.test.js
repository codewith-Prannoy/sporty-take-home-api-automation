const ApiClient = require('../src/utils/apiClient');
const config = require('../src/utils/config');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const {
  pokemonDetailSchema,
  pokemonListSchema,
  pokemonTypeSchema
} = require('../src/schemas/pokemonSchemas');
const { addAssertionReport } = require('../src/utils/assertionReport');
const pokemonTestCases = require('../test-data/pokemon.test-data.json');

const apiClient = new ApiClient({
  baseUrl: config.baseUrl,
  timeoutMs: config.requestTimeoutMs,
  retryCount: config.retryCount,
  logRequests: config.logApiRequests
});

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validatePokemonDetailSchema = ajv.compile(pokemonDetailSchema);
const validatePokemonListSchema = ajv.compile(pokemonListSchema);
const validatePokemonTypeSchema = ajv.compile(pokemonTypeSchema);

const mapStatsByName = (stats) => Object.fromEntries(
  stats.map((statSlot) => [statSlot.stat.name, statSlot.base_stat])
);

const expectSuccessfulJsonResponse = (response) => {
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type') || '').toContain('application/json');
  expect(response.data).toEqual(expect.any(Object));
};

const expectNotFoundTextResponse = (response) => {
  expect(response.status).toBe(404);
  expect(response.ok).toBe(false);
  expect(response.headers.get('content-type') || '').toContain('text/plain');
  expect(response.data).toBe('Not Found');
};

const invalidResourceTestCases = [
  {
    path: '/pokemon/not-a-real-pokemon-qa',
    description: 'an invalid Pokemon name'
  },
  {
    path: '/pokemon/0',
    description: 'an invalid Pokemon id'
  },
  {
    path: '/type/not-a-real-type-qa',
    description: 'an invalid Pokemon type'
  }
];

describe('PokeAPI automated API tests', () => {
  test.each(pokemonTestCases)(
    'GET /pokemon/$name returns $displayDetails',
    async ({
      name,
      id,
      height,
      weight,
      baseExperience,
      order,
      types,
      abilities,
      stats
    }) => {
      const response = await apiClient.get(`/pokemon/${name}`);
      expectSuccessfulJsonResponse(response);

      const actualTypes = response.data.types.map((typeSlot) => typeSlot.type.name);
      const actualAbilities = response.data.abilities.map((abilitySlot) => abilitySlot.ability.name);
      const actualStats = mapStatsByName(response.data.stats);
      const expectedSpriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

      await addAssertionReport({
        title: `Assertion-level details for GET /pokemon/${name}`,
        assertions: [
          { assertion: 'HTTP status should be 200', expected: 200, actual: response.status },
          { assertion: 'Content type should include JSON', expected: true, actual: response.headers.get('content-type').includes('application/json') },
          { assertion: 'Pokemon id', expected: id, actual: response.data.id },
          { assertion: 'Pokemon name', expected: name, actual: response.data.name },
          { assertion: 'Height', expected: height, actual: response.data.height },
          { assertion: 'Weight', expected: weight, actual: response.data.weight },
          { assertion: 'Base experience', expected: baseExperience, actual: response.data.base_experience },
          { assertion: 'Order', expected: order, actual: response.data.order },
          { assertion: 'Types', expected: types, actual: actualTypes },
          { assertion: 'Abilities', expected: abilities, actual: actualAbilities },
          { assertion: 'Stats', expected: stats, actual: actualStats },
          { assertion: 'Default sprite URL', expected: expectedSpriteUrl, actual: response.data.sprites.front_default }
        ]
      });

      expect(response.data).toEqual(expect.objectContaining({
        id,
        name,
        height,
        weight,
        base_experience: baseExperience,
        order
      }));
      expect(actualTypes).toEqual(types);
      expect(actualAbilities).toEqual(abilities);
      expect(actualStats).toEqual(stats);
      expect(response.data.sprites.front_default).toBe(expectedSpriteUrl);
    }
  );

  test('GET /pokemon/25 returns Pikachu species, forms, moves, and sprite details', async () => {
    const response = await apiClient.get('/pokemon/25');
    expectSuccessfulJsonResponse(response);

    const actualMoveNames = response.data.moves.map((moveSlot) => moveSlot.move.name);
    const expectedSpecies = {
      name: 'pikachu',
      url: 'https://pokeapi.co/api/v2/pokemon-species/25/'
    };
    const expectedForm = {
      name: 'pikachu',
      url: 'https://pokeapi.co/api/v2/pokemon-form/25/'
    };
    const expectedSprites = {
      front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
      front_shiny: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png'
    };

    await addAssertionReport({
      title: 'Assertion-level details for GET /pokemon/25',
      assertions: [
        { assertion: 'HTTP status should be 200', expected: 200, actual: response.status },
        { assertion: 'Pokemon id', expected: 25, actual: response.data.id },
        { assertion: 'Pokemon name', expected: 'pikachu', actual: response.data.name },
        { assertion: 'Height', expected: 4, actual: response.data.height },
        { assertion: 'Weight', expected: 60, actual: response.data.weight },
        { assertion: 'Base experience', expected: 112, actual: response.data.base_experience },
        { assertion: 'Moves should be an array', expected: true, actual: Array.isArray(response.data.moves) },
        { assertion: 'Moves should not be empty', expected: true, actual: response.data.moves.length > 0 },
        { assertion: 'Types should be an array', expected: true, actual: Array.isArray(response.data.types) },
        { assertion: 'Species link', expected: expectedSpecies, actual: response.data.species },
        { assertion: 'Forms include Pikachu form', expected: true, actual: response.data.forms.some((form) => JSON.stringify(form) === JSON.stringify(expectedForm)) },
        { assertion: 'Moves include key Pikachu moves', expected: ['mega-punch', 'thunder-punch', 'quick-attack'], actual: actualMoveNames.filter((move) => ['mega-punch', 'thunder-punch', 'quick-attack'].includes(move)) },
        { assertion: 'Default sprite URL', expected: expectedSprites.front_default, actual: response.data.sprites.front_default },
        { assertion: 'Shiny sprite URL', expected: expectedSprites.front_shiny, actual: response.data.sprites.front_shiny }
      ]
    });

    expect(response.data.id).toBe(25);
    expect(response.data.name).toBe('pikachu');
    expect(response.data.height).toBe(4);
    expect(response.data.weight).toBe(60);
    expect(response.data.base_experience).toBe(112);
    expect(Array.isArray(response.data.moves)).toBe(true);
    expect(response.data.moves.length).toBeGreaterThan(0);
    expect(Array.isArray(response.data.types)).toBe(true);
    expect(response.data.species).toEqual(expectedSpecies);
    expect(response.data.forms).toContainEqual(expectedForm);
    expect(actualMoveNames).toEqual(
      expect.arrayContaining(['mega-punch', 'thunder-punch', 'quick-attack'])
    );
    expect(response.data.sprites).toEqual(expect.objectContaining(expectedSprites));
  });

  test('GET /pokemon/25 response matches Pokemon detail JSON schema', async () => {
    const response = await apiClient.get('/pokemon/25');
    expectSuccessfulJsonResponse(response);

    const isValidSchema = validatePokemonDetailSchema(response.data);

    await addAssertionReport({
      title: 'Assertion-level details for Pokemon detail JSON schema',
      assertions: [
        { assertion: 'HTTP status should be 200', expected: 200, actual: response.status },
        { assertion: 'Pokemon detail schema should be valid', expected: true, actual: isValidSchema },
        { assertion: 'AJV validation errors should be null', expected: null, actual: validatePokemonDetailSchema.errors }
      ]
    });

    expect(validatePokemonDetailSchema.errors).toBeNull();
    expect(isValidSchema).toBe(true);
  });

  test('GET /pokemon supports limit and offset pagination', async () => {
    const response = await apiClient.get('/pokemon?limit=5&offset=0');
    expectSuccessfulJsonResponse(response);

    const resultUrlsMatchExpectedPattern = response.data.results.every((pokemon) => (
      /^https:\/\/pokeapi\.co\/api\/v2\/pokemon\/\d+\/$/.test(pokemon.url)
    ));
    const resultNamesArePresent = response.data.results.every((pokemon) => (
      typeof pokemon.name === 'string' && pokemon.name.length > 0
    ));

    await addAssertionReport({
      title: 'Assertion-level details for Pokemon pagination',
      assertions: [
        { assertion: 'HTTP status should be 200', expected: 200, actual: response.status },
        { assertion: 'Total count should be greater than zero', expected: true, actual: response.data.count > 0 },
        { assertion: 'Next page link should contain offset 5', expected: true, actual: response.data.next.includes('offset=5') },
        { assertion: 'Previous page should be null for first page', expected: null, actual: response.data.previous },
        { assertion: 'Result count should match requested limit', expected: 5, actual: response.data.results.length },
        { assertion: 'Each result should have a name', expected: true, actual: resultNamesArePresent },
        { assertion: 'Each result URL should match Pokemon resource pattern', expected: true, actual: resultUrlsMatchExpectedPattern }
      ]
    });

    expect(response.data.count).toBeGreaterThan(0);
    expect(response.data.next).toContain('offset=5');
    expect(response.data.previous).toBeNull();
    expect(response.data.results).toHaveLength(5);
    response.data.results.forEach((pokemon) => {
      expect(pokemon).toEqual(expect.objectContaining({
        name: expect.any(String),
        url: expect.stringMatching(/^https:\/\/pokeapi\.co\/api\/v2\/pokemon\/\d+\/$/)
      }));
    });
  });

  test('GET /pokemon list response matches pagination JSON schema', async () => {
    const response = await apiClient.get('/pokemon?limit=5&offset=0');
    expectSuccessfulJsonResponse(response);

    const isValidSchema = validatePokemonListSchema(response.data);

    await addAssertionReport({
      title: 'Assertion-level details for Pokemon list JSON schema',
      assertions: [
        { assertion: 'HTTP status should be 200', expected: 200, actual: response.status },
        { assertion: 'Pokemon list schema should be valid', expected: true, actual: isValidSchema },
        { assertion: 'AJV validation errors should be null', expected: null, actual: validatePokemonListSchema.errors }
      ]
    });

    expect(validatePokemonListSchema.errors).toBeNull();
    expect(isValidSchema).toBe(true);
  });

  test('GET /type/electric returns type details and linked pokemon', async () => {
    const response = await apiClient.get('/type/electric');
    expectSuccessfulJsonResponse(response);

    const linkedPokemonNames = response.data.pokemon.map((entry) => entry.pokemon.name);

    await addAssertionReport({
      title: 'Assertion-level details for GET /type/electric',
      assertions: [
        { assertion: 'HTTP status should be 200', expected: 200, actual: response.status },
        { assertion: 'Type name', expected: 'electric', actual: response.data.name },
        { assertion: 'Damage relations should be an object', expected: true, actual: response.data.damage_relations && typeof response.data.damage_relations === 'object' },
        { assertion: 'Linked Pokemon list should not be empty', expected: true, actual: response.data.pokemon.length > 0 },
        { assertion: 'Linked Pokemon should include Pikachu', expected: true, actual: linkedPokemonNames.includes('pikachu') }
      ]
    });

    expect(response.data.name).toBe('electric');
    expect(response.data.damage_relations).toEqual(expect.any(Object));
    expect(response.data.pokemon.length).toBeGreaterThan(0);
    expect(linkedPokemonNames).toContain('pikachu');
  });

  test('GET /type/electric response matches Pokemon type JSON schema', async () => {
    const response = await apiClient.get('/type/electric');
    expectSuccessfulJsonResponse(response);

    const isValidSchema = validatePokemonTypeSchema(response.data);

    await addAssertionReport({
      title: 'Assertion-level details for Pokemon type JSON schema',
      assertions: [
        { assertion: 'HTTP status should be 200', expected: 200, actual: response.status },
        { assertion: 'Pokemon type schema should be valid', expected: true, actual: isValidSchema },
        { assertion: 'AJV validation errors should be null', expected: null, actual: validatePokemonTypeSchema.errors }
      ]
    });

    expect(validatePokemonTypeSchema.errors).toBeNull();
    expect(isValidSchema).toBe(true);
  });

  test.each(invalidResourceTestCases)(
    'GET $path returns 404 for $description',
    async ({ path, description }) => {
      const response = await apiClient.get(path);

      await addAssertionReport({
        title: `Assertion-level details for ${description}`,
        assertions: [
          { assertion: 'HTTP status should be 404', expected: 404, actual: response.status },
          { assertion: 'Response should not be successful', expected: false, actual: response.ok },
          { assertion: 'Content type should be plain text', expected: true, actual: (response.headers.get('content-type') || '').includes('text/plain') },
          { assertion: 'Response body should say Not Found', expected: 'Not Found', actual: response.data }
        ]
      });

      expectNotFoundTextResponse(response);
    }
  );
});
