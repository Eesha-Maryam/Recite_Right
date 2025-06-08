const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const quizValidation = require('../../validations/quiz.validation');
const quizController = require('../../controllers/quiz.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Quiz
 *   description: Quiz generation and management
 */

/**
 * @swagger
 * /v1/quiz:
 *   get:
 *     summary: Generate a quiz with multiple choice questions
 *     description: Generates a quiz about a specified topic with the requested number of questions
 *     tags: [Quiz]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *         description: The topic for the quiz
 *         example: "Surahs 78 to 114 of the Quran"
 *       - in: query
 *         name: numQuestions
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 15
 *         description: Number of questions to generate
 *         example: 10
 *     responses:
 *       "200":
 *         description: Quiz generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Quiz generated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     title:
 *                       type: string
 *                       example: "Surahs 78 to 114 Quiz"
 *                     description:
 *                       type: string
 *                       example: "A quiz about Surahs 78 to 114 with 10 questions"
 *                     questions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "507f1f77bcf86cd799439012"
 *                           question:
 *                             type: string
 *                             example: "What is the name of Surah 78?"
 *                           options:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["An-Naba", "An-Nazi'at", "Abasa", "At-Takwir"]
 *                           correctAnswer:
 *                             type: number
 *                             example: 0
 *                     createdBy:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439014"
 *                     status:
 *                       type: string
 *                       enum: [active, archived]
 *                       example: "active"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-03-20T12:00:00Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-03-20T12:00:00Z"
 *                 error:
 *                   type: null
 *       "400":
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "401":
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "500":
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.route('/').get(auth(), validate(quizValidation.generateQuiz), quizController.getQuiz);

/**
 * @swagger
 * /v1/quiz/list:
 *   get:
 *     summary: Get user's quizzes
 *     description: Retrieves all quizzes created by or attempted by the user
 *     tags: [Quiz]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Quizzes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Quizzes retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "507f1f77bcf86cd799439011"
 *                       title:
 *                         type: string
 *                         example: "Surahs 78 to 114 Quiz"
 *                       description:
 *                         type: string
 *                         example: "A quiz about Surahs 78 to 114 with 10 questions"
 *                       questions:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: "507f1f77bcf86cd799439012"
 *                             question:
 *                               type: string
 *                               example: "What is the name of Surah 78?"
 *                             options:
 *                               type: array
 *                               items:
 *                                 type: string
 *                               example: ["An-Naba", "An-Nazi'at", "Abasa", "At-Takwir"]
 *                             correctAnswer:
 *                               type: number
 *                               example: 0
 *                       createdBy:
 *                         type: string
 *                         example: "507f1f77bcf86cd799439014"
 *                       status:
 *                         type: string
 *                         enum: [active, archived]
 *                         example: "active"
 *                       attempts:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: "507f1f77bcf86cd799439013"
 *                             user:
 *                               type: string
 *                               example: "507f1f77bcf86cd799439014"
 *                             startedAt:
 *                               type: string
 *                               format: date-time
 *                               example: "2024-03-20T12:00:00Z"
 *                             completedAt:
 *                               type: string
 *                               format: date-time
 *                               example: "2024-03-20T12:05:00Z"
 *                             answers:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   questionId:
 *                                     type: string
 *                                   selectedOption:
 *                                     type: number
 *                                   isCorrect:
 *                                     type: boolean
 *                             score:
 *                               type: number
 *                               example: 8
 *                             timeSpent:
 *                               type: number
 *                               example: 240
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-03-20T12:00:00Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-03-20T12:00:00Z"
 *                 error:
 *                   type: null
 *       "401":
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.route('/list').get(auth(), quizController.getQuizzes);

/**
 * @swagger
 * /v1/quiz/submit:
 *   post:
 *     summary: Submit quiz answers
 *     description: Submit answers for a quiz and get the score
 *     tags: [Quiz]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quizId
 *               - answers
 *             properties:
 *               quizId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - questionId
 *                     - selectedOption
 *                   properties:
 *                     questionId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439012"
 *                     selectedOption:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 3
 *                       description: Index of the selected option (0-3)
 *                       example: 0
 *     responses:
 *       "200":
 *         description: Quiz submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Quiz submitted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     score:
 *                       type: number
 *                       example: 8
 *                     totalQuestions:
 *                       type: number
 *                       example: 10
 *                     correctAnswers:
 *                       type: number
 *                       example: 8
 *                     attemptId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439013"
 *                 error:
 *                   type: null
 *       "400":
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "401":
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "404":
 *         description: Quiz not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.route('/submit').post(auth(), validate(quizValidation.submitQuiz), quizController.submitQuiz);

/**
 * @swagger
 * /v1/quiz/{quizId}:
 *   get:
 *     summary: Get quiz details
 *     description: Get detailed information about a specific quiz
 *     tags: [Quiz]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz ID
 *     responses:
 *       "200":
 *         description: Quiz details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Quiz details retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     title:
 *                       type: string
 *                       example: "Surahs 78 to 114 Quiz"
 *                     description:
 *                       type: string
 *                       example: "A quiz about Surahs 78 to 114 with 10 questions"
 *                     questions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "507f1f77bcf86cd799439012"
 *                           question:
 *                             type: string
 *                             example: "What is the name of Surah 78?"
 *                           options:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["An-Naba", "An-Nazi'at", "Abasa", "At-Takwir"]
 *                           correctAnswer:
 *                             type: number
 *                             example: 0
 *                     attempts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "507f1f77bcf86cd799439013"
 *                           user:
 *                             type: string
 *                             example: "507f1f77bcf86cd799439014"
 *                           score:
 *                             type: number
 *                             example: 8
 *                           timeSpent:
 *                             type: number
 *                             example: 240
 *                 error:
 *                   type: null
 *       "401":
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Please authenticate"
 *                 error:
 *                   type: string
 *                   example: "No access token provided"
 *       "404":
 *         description: Quiz not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Not found"
 *                 error:
 *                   type: string
 *                   example: "Quiz not found"
 */
router.route('/:quizId').get(auth(), validate(quizValidation.getQuizById), quizController.getQuizDetails);

module.exports = router;
