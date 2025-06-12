const express = require('express');

const router = express.Router();
const searchController = require('../../controllers/search.controller');

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Search functionality for Quranic content
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Invalid input"
 *         error:
 *           type: string
 *           example: "Error fetching data"
 *     SurahData:
 *       type: object
 *       properties:
 *         latin:
 *           type: string
 *           description: Latin name of the surah
 *           example: "An-Naba"
 */

/**
 * @swagger
 * /v1/search:
 *   get:
 *     summary: Get information about Surahs 78-114
 *     description: Returns a list of surahs from 78 to 114 with their Latin names
 *     tags: [Search]
 *     responses:
 *       "200":
 *         description: OK
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
 *                   example: "Search results retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     response:
 *                       type: object
 *                       additionalProperties:
 *                         $ref: '#/components/schemas/SurahData'
 *                       example:
 *                         "78":
 *                           latin: "An-Naba"
 *                         "79":
 *                           latin: "An-Nazi'at"
 *                 error:
 *                   type: null
 *       "400":
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.get('/', searchController.search);

module.exports = router;
