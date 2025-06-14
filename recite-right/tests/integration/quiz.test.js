const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { userOne, insertUsers } = require('../fixtures/user.fixture');
const { userOneAccessToken } = require('../fixtures/token.fixture');

setupTestDB();

// Increase timeout for all tests in this suite
jest.setTimeout(30000);

describe('Quiz routes', () => {
  let generatedQuiz;

  beforeEach(async () => {
    await insertUsers([userOne]);
    // Generate a quiz before each test
    const res = await request(app)
      .get('/v1/quiz')
      .query({ topic: 'Surahs 78 to 114', numQuestions: 10 })
      .set('Authorization', `Bearer ${userOneAccessToken}`)
      .send()
      .expect(httpStatus.OK);
    generatedQuiz = res.body.data;
    // Wait for the quiz to be fully generated and populated
    await new Promise((resolve) => setTimeout(resolve, 10000));
    // Ensure the quiz has questions before proceeding
    if (!generatedQuiz.questions || !Array.isArray(generatedQuiz.questions) || generatedQuiz.questions.length === 0) {
      throw new Error('Quiz generation failed - no questions were generated');
    }
  });

  describe('GET /v1/quiz', () => {
    test('should return 200 and generate quiz questions', async () => {
      const res = await request(app)
        .get('/v1/quiz')
        .query({ topic: 'Surahs 78 to 114', numQuestions: 10 })
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        success: true,
        message: 'Quiz generated successfully',
        data: expect.any(Object),
        error: null,
      });

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('title');
      expect(res.body.data).toHaveProperty('description');
      expect(res.body.data).toHaveProperty('questions');
      expect(Array.isArray(res.body.data.questions)).toBe(true);
      expect(res.body.data.questions.length).toBeGreaterThan(0);
    });

    test('should return 401 if access token is missing', async () => {
      await request(app)
        .get('/v1/quiz')
        .query({ topic: 'Surahs 78 to 114', numQuestions: 10 })
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 if access token is invalid', async () => {
      await request(app)
        .get('/v1/quiz')
        .query({ topic: 'Surahs 78 to 114', numQuestions: 10 })
        .set('Authorization', 'Bearer invalid-token')
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 400 if topic is missing', async () => {
      await request(app)
        .get('/v1/quiz')
        .query({ numQuestions: 10 })
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if numQuestions is invalid', async () => {
      await request(app)
        .get('/v1/quiz')
        .query({ topic: 'Surahs 78 to 114', numQuestions: 25 })
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('POST /v1/quiz/submit', () => {
    test('should return 200 and calculate score when answers are submitted', async () => {
      const answers = {
        quizId: generatedQuiz.id,
        answers: generatedQuiz.questions.map((q) => ({
          questionId: q._id,
          selectedOption: q.correctAnswer,
        })),
      };

      const res = await request(app)
        .post('/v1/quiz/submit')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(answers)
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        success: true,
        message: 'Quiz submitted successfully',
        data: {
          score: expect.any(Number),
          totalQuestions: expect.any(Number),
          correctAnswers: expect.any(Number),
          attemptId: expect.any(String),
        },
        error: null,
      });

      expect(res.body.data.score).toBe(generatedQuiz.questions.length);
      expect(res.body.data.totalQuestions).toBe(generatedQuiz.questions.length);
      expect(res.body.data.correctAnswers).toBe(generatedQuiz.questions.length);
    });

    test('should return 200 and calculate partial score when some answers are wrong', async () => {
      const answers = {
        quizId: generatedQuiz.id,
        answers: generatedQuiz.questions.map((q, index) => ({
          questionId: q._id,
          selectedOption: index === 0 ? 0 : q.correctAnswer, // First answer is wrong
        })),
      };

      const res = await request(app)
        .post('/v1/quiz/submit')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(answers)
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        success: true,
        message: 'Quiz submitted successfully',
        data: {
          score: expect.any(Number),
          totalQuestions: expect.any(Number),
          correctAnswers: expect.any(Number),
          attemptId: expect.any(String),
        },
        error: null,
      });

      expect(res.body.data.score).toBe(generatedQuiz.questions.length - 1);
      expect(res.body.data.totalQuestions).toBe(generatedQuiz.questions.length);
      expect(res.body.data.correctAnswers).toBe(generatedQuiz.questions.length - 1);
    });

    test('should return 400 if quizId is missing', async () => {
      const answers = {
        answers: generatedQuiz.questions.map((q) => ({
          questionId: q._id,
          selectedOption: q.correctAnswer,
        })),
      };

      await request(app)
        .post('/v1/quiz/submit')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(answers)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if answers array is missing', async () => {
      const answers = {
        quizId: generatedQuiz.id,
      };

      await request(app)
        .post('/v1/quiz/submit')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(answers)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if answers array is empty', async () => {
      const answers = {
        quizId: generatedQuiz.id,
        answers: [],
      };

      await request(app)
        .post('/v1/quiz/submit')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(answers)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if questionId is missing in any answer', async () => {
      const answers = {
        quizId: generatedQuiz.id,
        answers: [{ selectedOption: 0 }, { questionId: generatedQuiz.questions[1]._id, selectedOption: 1 }],
      };

      await request(app)
        .post('/v1/quiz/submit')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(answers)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if selectedOption is missing in any answer', async () => {
      const answers = {
        quizId: generatedQuiz.id,
        answers: [
          { questionId: generatedQuiz.questions[0]._id },
          { questionId: generatedQuiz.questions[1]._id, selectedOption: 1 },
        ],
      };

      await request(app)
        .post('/v1/quiz/submit')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(answers)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 401 if access token is missing', async () => {
      const answers = {
        quizId: generatedQuiz.id,
        answers: generatedQuiz.questions.map((q) => ({
          questionId: q._id,
          selectedOption: q.correctAnswer,
        })),
      };

      await request(app).post('/v1/quiz/submit').send(answers).expect(httpStatus.UNAUTHORIZED);
    });
  });
});
