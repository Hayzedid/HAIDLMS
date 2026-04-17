import { Router } from 'express';
import { searchController } from '../controllers/search.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Search & Discovery
 *   description: Full-text search, recommendations, and content discovery
 */

// SEARCH OPERATIONS
/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search content
 *     tags: [Search & Discovery]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityTypes
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [relevance, recent, popular, rating]
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.get('/', searchController.search.bind(searchController));

/**
 * @swagger
 * /api/search/advanced:
 *   post:
 *     summary: Advanced search with filters
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *               entityTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *               filters:
 *                 type: object
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.post('/advanced', authenticate, searchController.advancedSearch.bind(searchController));

/**
 * @swagger
 * /api/search/clicks:
 *   post:
 *     summary: Record search result click
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - queryId
 *               - entityType
 *               - entityId
 *               - resultPosition
 *             properties:
 *               queryId:
 *                 type: string
 *               entityType:
 *                 type: string
 *               entityId:
 *                 type: string
 *               resultPosition:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Click recorded successfully
 */
router.post('/clicks', authenticate, searchController.recordSearchClick.bind(searchController));

// AUTO-COMPLETE
/**
 * @swagger
 * /api/search/suggestions:
 *   get:
 *     summary: Get search suggestions
 *     tags: [Search & Discovery]
 *     parameters:
 *       - in: query
 *         name: prefix
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Suggestions retrieved successfully
 */
router.get('/suggestions', searchController.getSuggestions.bind(searchController));

/**
 * @swagger
 * /api/search/suggestions:
 *   post:
 *     summary: Create search suggestion
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - suggestionText
 *             properties:
 *               suggestionText:
 *                 type: string
 *               suggestionType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Suggestion created successfully
 */
router.post('/suggestions', authenticate, searchController.createSuggestion.bind(searchController));

// SAVED SEARCHES
/**
 * @swagger
 * /api/search/saved:
 *   post:
 *     summary: Save a search
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - searchName
 *               - queryText
 *             properties:
 *               searchName:
 *                 type: string
 *               queryText:
 *                 type: string
 *               searchFilters:
 *                 type: object
 *     responses:
 *       201:
 *         description: Search saved successfully
 */
router.post('/saved', authenticate, searchController.createSavedSearch.bind(searchController));

/**
 * @swagger
 * /api/search/saved:
 *   get:
 *     summary: List saved searches
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saved searches retrieved successfully
 */
router.get('/saved', authenticate, searchController.listSavedSearches.bind(searchController));

/**
 * @swagger
 * /api/search/saved/{searchId}:
 *   get:
 *     summary: Get saved search
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: searchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Saved search retrieved successfully
 */
router.get('/saved/:searchId', authenticate, searchController.getSavedSearch.bind(searchController));

/**
 * @swagger
 * /api/search/saved/{searchId}:
 *   patch:
 *     summary: Update saved search
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: searchId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Saved search updated successfully
 */
router.patch('/saved/:searchId', authenticate, searchController.updateSavedSearch.bind(searchController));

/**
 * @swagger
 * /api/search/saved/{searchId}:
 *   delete:
 *     summary: Delete saved search
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: searchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Saved search deleted successfully
 */
router.delete('/saved/:searchId', authenticate, searchController.deleteSavedSearch.bind(searchController));

/**
 * @swagger
 * /api/search/saved/{searchId}/execute:
 *   post:
 *     summary: Execute saved search
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: searchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search executed successfully
 */
router.post('/saved/:searchId/execute', authenticate, searchController.executeSavedSearch.bind(searchController));

// TRENDING & ANALYTICS
/**
 * @swagger
 * /api/search/trending:
 *   get:
 *     summary: Get trending searches
 *     tags: [Search & Discovery]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [hourly, daily, weekly]
 *           default: daily
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Trending searches retrieved successfully
 */
router.get('/trending', searchController.getTrendingSearches.bind(searchController));

/**
 * @swagger
 * /api/search/popular:
 *   get:
 *     summary: Get popular searches
 *     tags: [Search & Discovery]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Popular searches retrieved successfully
 */
router.get('/popular', searchController.getPopularSearches.bind(searchController));

/**
 * @swagger
 * /api/search/failed:
 *   get:
 *     summary: Get failed searches
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Failed searches retrieved successfully
 */
router.get('/failed', authenticate, searchController.getFailedSearches.bind(searchController));

/**
 * @swagger
 * /api/search/performance:
 *   get:
 *     summary: Get search performance
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Performance data retrieved successfully
 */
router.get('/performance', authenticate, searchController.getSearchPerformance.bind(searchController));

/**
 * @swagger
 * /api/search/analytics:
 *   get:
 *     summary: Get search analytics
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 */
router.get('/analytics', authenticate, searchController.getSearchAnalytics.bind(searchController));

/**
 * @swagger
 * /api/search/history:
 *   get:
 *     summary: Get user search history
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: History retrieved successfully
 */
router.get('/history', authenticate, searchController.getUserSearchHistory.bind(searchController));

// RECOMMENDATIONS
/**
 * @swagger
 * /api/search/recommendations:
 *   get:
 *     summary: Get content recommendations
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recommendations retrieved successfully
 */
router.get('/recommendations', authenticate, searchController.getRecommendations.bind(searchController));

/**
 * @swagger
 * /api/search/recommendations:
 *   post:
 *     summary: Create recommendation
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recommendedEntityType
 *               - recommendedEntityId
 *               - recommendationSource
 *             properties:
 *               recommendedEntityType:
 *                 type: string
 *               recommendedEntityId:
 *                 type: string
 *               recommendationSource:
 *                 type: string
 *     responses:
 *       201:
 *         description: Recommendation created successfully
 */
router.post('/recommendations', authenticate, searchController.createRecommendation.bind(searchController));

/**
 * @swagger
 * /api/search/recommendations/{recommendationId}/displayed:
 *   post:
 *     summary: Mark recommendation as displayed
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recommendation marked as displayed
 */
router.post('/recommendations/:recommendationId/displayed', authenticate, searchController.markRecommendationDisplayed.bind(searchController));

/**
 * @swagger
 * /api/search/recommendations/{recommendationId}/clicked:
 *   post:
 *     summary: Mark recommendation as clicked
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recommendation marked as clicked
 */
router.post('/recommendations/:recommendationId/clicked', authenticate, searchController.markRecommendationClicked.bind(searchController));

// SEARCH INDEX MANAGEMENT
/**
 * @swagger
 * /api/search/index:
 *   post:
 *     summary: Add to search index
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entityType
 *               - entityId
 *               - title
 *             properties:
 *               entityType:
 *                 type: string
 *               entityId:
 *                 type: string
 *               title:
 *                 type: string
 *     responses:
 *       201:
 *         description: Added to index successfully
 */
router.post('/index', authenticate, searchController.addToSearchIndex.bind(searchController));

/**
 * @swagger
 * /api/search/index/{entityType}/{entityId}:
 *   patch:
 *     summary: Update search index
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Index updated successfully
 */
router.patch('/index/:entityType/:entityId', authenticate, searchController.updateSearchIndex.bind(searchController));

/**
 * @swagger
 * /api/search/index/{entityType}/{entityId}:
 *   delete:
 *     summary: Remove from search index
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Removed from index successfully
 */
router.delete('/index/:entityType/:entityId', authenticate, searchController.removeFromSearchIndex.bind(searchController));

/**
 * @swagger
 * /api/search/index/{entityType}/{entityId}/popularity:
 *   post:
 *     summary: Update popularity score
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Popularity score updated successfully
 */
router.post('/index/:entityType/:entityId/popularity', authenticate, searchController.updatePopularityScore.bind(searchController));

// FACETS
/**
 * @swagger
 * /api/search/facets:
 *   get:
 *     summary: Get search facets
 *     tags: [Search & Discovery]
 *     parameters:
 *       - in: query
 *         name: entityTypes
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Facets retrieved successfully
 */
router.get('/facets', searchController.getFacets.bind(searchController));

/**
 * @swagger
 * /api/search/facets:
 *   post:
 *     summary: Create search facet
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - facetKey
 *               - facetName
 *               - facetType
 *             properties:
 *               facetKey:
 *                 type: string
 *               facetName:
 *                 type: string
 *               facetType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Facet created successfully
 */
router.post('/facets', authenticate, searchController.createFacet.bind(searchController));

// USER PREFERENCES
/**
 * @swagger
 * /api/search/preferences:
 *   get:
 *     summary: Get user search preferences
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preferences retrieved successfully
 */
router.get('/preferences', authenticate, searchController.getUserSearchPreferences.bind(searchController));

/**
 * @swagger
 * /api/search/preferences:
 *   post:
 *     summary: Update user search preferences
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 */
router.post('/preferences', authenticate, searchController.updateUserSearchPreferences.bind(searchController));

// SYNONYMS
/**
 * @swagger
 * /api/search/synonyms:
 *   post:
 *     summary: Create synonym
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - terms
 *             properties:
 *               terms:
 *                 type: array
 *                 items:
 *                   type: string
 *               synonymType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Synonym created successfully
 */
router.post('/synonyms', authenticate, searchController.createSynonym.bind(searchController));

/**
 * @swagger
 * /api/search/synonyms:
 *   get:
 *     summary: List synonyms
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Synonyms retrieved successfully
 */
router.get('/synonyms', authenticate, searchController.listSynonyms.bind(searchController));

// STOPWORDS
/**
 * @swagger
 * /api/search/stopwords:
 *   post:
 *     summary: Create stopword
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - word
 *             properties:
 *               word:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       201:
 *         description: Stopword created successfully
 */
router.post('/stopwords', authenticate, searchController.createStopword.bind(searchController));

/**
 * @swagger
 * /api/search/stopwords:
 *   get:
 *     summary: List stopwords
 *     tags: [Search & Discovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stopwords retrieved successfully
 */
router.get('/stopwords', authenticate, searchController.listStopwords.bind(searchController));

export default router;
