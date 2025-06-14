const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { userOne, insertUsers } = require('../fixtures/user.fixture');
const { searchResults, insertSearchResults } = require('../fixtures/search.fixture');

setupTestDB();

describe('Search routes', () => {
  beforeEach(async () => {
    await insertUsers([userOne]);
    await insertSearchResults(searchResults);
  });

  describe('GET /v1/search', () => {
    test('should return 200 and all results when no query is provided', async () => {
      const res = await request(app).get('/v1/search').send().expect(httpStatus.OK);

      expect(res.body).toEqual({
        success: true,
        message: 'Search results retrieved successfully',
        data: expect.arrayContaining([
          expect.objectContaining({
            name: 'Al-Fatiha',
            englishName: 'The Opening',
          }),
          expect.objectContaining({
            name: 'Al-Baqarah',
            englishName: 'The Cow',
          }),
        ]),
        error: null,
      });
      expect(res.body.data).toHaveLength(searchResults.length);
    });

    test('should return 200 and search results when query matches', async () => {
      const res = await request(app).get('/v1/search').query({ query: 'Opening' }).send().expect(httpStatus.OK);

      expect(res.body).toEqual({
        success: true,
        message: 'Search results retrieved successfully',
        data: expect.arrayContaining([
          expect.objectContaining({
            name: 'Al-Fatiha',
            englishName: 'The Opening',
          }),
        ]),
        error: null,
      });
    });

    test('should return 200 and empty array when no results found', async () => {
      const res = await request(app).get('/v1/search').query({ query: 'nonexistentterm' }).send().expect(httpStatus.OK);

      expect(res.body).toEqual({
        success: true,
        message: 'No results found',
        data: [],
        error: null,
      });
    });

    test('should return 200 and search results when query matches partial name', async () => {
      const res = await request(app).get('/v1/search').query({ query: 'Fatiha' }).send().expect(httpStatus.OK);

      expect(res.body).toEqual({
        success: true,
        message: 'Search results retrieved successfully',
        data: expect.arrayContaining([
          expect.objectContaining({
            name: 'Al-Fatiha',
            englishName: 'The Opening',
          }),
        ]),
        error: null,
      });
    });

    test('should return 200 and search results when query matches english name', async () => {
      const res = await request(app).get('/v1/search').query({ query: 'Cow' }).send().expect(httpStatus.OK);

      expect(res.body).toEqual({
        success: true,
        message: 'Search results retrieved successfully',
        data: expect.arrayContaining([
          expect.objectContaining({
            name: 'Al-Baqarah',
            englishName: 'The Cow',
          }),
        ]),
        error: null,
      });
    });
  });
});
