import { Router } from 'express';
import { localizationController } from '../controllers/localization.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Localization
 *   description: Multi-language support, translations, and locale management
 */

// LOCALES
/**
 * @swagger
 * /api/localization/locales:
 *   get:
 *     summary: List locales
 *     tags: [Localization]
 *     parameters:
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Locales retrieved successfully
 */
router.get('/locales', localizationController.listLocales.bind(localizationController));

/**
 * @swagger
 * /api/localization/locales:
 *   post:
 *     summary: Create locale
 *     tags: [Localization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               nativeName:
 *                 type: string
 *               languageCode:
 *                 type: string
 *               countryCode:
 *                 type: string
 *               direction:
 *                 type: string
 *               isRtl:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Locale created successfully
 */
router.post('/locales', authenticate, localizationController.createLocale.bind(localizationController));

/**
 * @swagger
 * /api/localization/locales/{localeId}:
 *   get:
 *     summary: Get locale
 *     tags: [Localization]
 *     parameters:
 *       - in: path
 *         name: localeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Locale retrieved successfully
 */
router.get('/locales/:localeId', localizationController.getLocale.bind(localizationController));

/**
 * @swagger
 * /api/localization/locales/{localeId}:
 *   patch:
 *     summary: Update locale
 *     tags: [Localization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: localeId
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
 *         description: Locale updated successfully
 */
router.patch('/locales/:localeId', authenticate, localizationController.updateLocale.bind(localizationController));

// TRANSLATION KEYS
/**
 * @swagger
 * /api/localization/keys:
 *   post:
 *     summary: Create translation key
 *     tags: [Localization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *             properties:
 *               key:
 *                 type: string
 *               namespace:
 *                 type: string
 *               description:
 *                 type: string
 *               context:
 *                 type: string
 *               supportsPluraliz ation:
 *                 type: boolean
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Translation key created successfully
 */
router.post('/keys', authenticate, localizationController.createTranslationKey.bind(localizationController));

/**
 * @swagger
 * /api/localization/keys:
 *   get:
 *     summary: List translation keys
 *     tags: [Localization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: namespace
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Translation keys retrieved successfully
 */
router.get('/keys', authenticate, localizationController.listTranslationKeys.bind(localizationController));

// TRANSLATIONS
/**
 * @swagger
 * /api/localization/translations:
 *   post:
 *     summary: Create translation
 *     tags: [Localization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - keyId
 *               - localeId
 *               - value
 *             properties:
 *               keyId:
 *                 type: string
 *               localeId:
 *                 type: string
 *               value:
 *                 type: string
 *               quality:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: Translation created successfully
 */
router.post('/translations', authenticate, localizationController.createTranslation.bind(localizationController));

/**
 * @swagger
 * /api/localization/translations/{key}:
 *   get:
 *     summary: Get translation by key
 *     tags: [Localization]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: locale
 *         schema:
 *           type: string
 *           default: en
 *     responses:
 *       200:
 *         description: Translation retrieved successfully
 */
router.get('/translations/:key', localizationController.getTranslation.bind(localizationController));

/**
 * @swagger
 * /api/localization/translations/locale/{localeId}:
 *   get:
 *     summary: List translations for locale
 *     tags: [Localization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: localeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: namespace
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 1000
 *     responses:
 *       200:
 *         description: Translations retrieved successfully
 */
router.get('/translations/locale/:localeId', authenticate, localizationController.listTranslations.bind(localizationController));

/**
 * @swagger
 * /api/localization/translations/{translationId}:
 *   patch:
 *     summary: Update translation
 *     tags: [Localization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: translationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: string
 *     responses:
 *       200:
 *         description: Translation updated successfully
 */
router.patch('/translations/:translationId', authenticate, localizationController.updateTranslation.bind(localizationController));

/**
 * @swagger
 * /api/localization/translations/{translationId}/approve:
 *   post:
 *     summary: Approve translation
 *     tags: [Localization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: translationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Translation approved successfully
 */
router.post('/translations/:translationId/approve', authenticate, localizationController.approveTranslation.bind(localizationController));

/**
 * @swagger
 * /api/localization/translations/{translationId}/publish:
 *   post:
 *     summary: Publish translation
 *     tags: [Localization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: translationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Translation published successfully
 */
router.post('/translations/:translationId/publish', authenticate, localizationController.publishTranslation.bind(localizationController));

/**
 * @swagger
 * /api/localization/translations/completeness:
 *   get:
 *     summary: Get translation completeness
 *     tags: [Localization]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Completeness data retrieved successfully
 */
router.get('/translations/completeness', authenticate, localizationController.getTranslationCompleteness.bind(localizationController));

// CONTENT LOCALIZATIONS
/**
 * @swagger
 * /api/localization/content:
 *   post:
 *     summary: Create content localization
 *     tags: [Localization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentType
 *               - contentId
 *               - localeId
 *             properties:
 *               contentType:
 *                 type: string
 *               contentId:
 *                 type: string
 *               localeId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               body:
 *                 type: string
 *     responses:
 *       201:
 *         description: Content localization created successfully
 */
router.post('/content', authenticate, localizationController.createContentLocalization.bind(localizationController));

/**
 * @swagger
 * /api/localization/content/{contentType}/{contentId}/{localeId}:
 *   get:
 *     summary: Get content localization
 *     tags: [Localization]
 *     parameters:
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: localeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content localization retrieved successfully
 */
router.get('/content/:contentType/:contentId/:localeId', localizationController.getContentLocalization.bind(localizationController));

/**
 * @swagger
 * /api/localization/content/{localizationId}:
 *   patch:
 *     summary: Update content localization
 *     tags: [Localization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: localizationId
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
 *         description: Content localization updated successfully
 */
router.patch('/content/:localizationId', authenticate, localizationController.updateContentLocalization.bind(localizationController));

/**
 * @swagger
 * /api/localization/content/progress:
 *   get:
 *     summary: Get content localization progress
 *     tags: [Localization]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Progress data retrieved successfully
 */
router.get('/content/progress', authenticate, localizationController.getContentLocalizationProgress.bind(localizationController));

// USER PREFERENCES
/**
 * @swagger
 * /api/localization/preferences:
 *   post:
 *     summary: Set user locale preference
 *     tags: [Localization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - localeId
 *             properties:
 *               localeId:
 *                 type: string
 *               timezone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Preference set successfully
 */
router.post('/preferences', authenticate, localizationController.setUserLocalePreference.bind(localizationController));

/**
 * @swagger
 * /api/localization/preferences:
 *   get:
 *     summary: Get user locale preference
 *     tags: [Localization]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preference retrieved successfully
 */
router.get('/preferences', authenticate, localizationController.getUserLocalePreference.bind(localizationController));

// TRANSLATION MEMORY
/**
 * @swagger
 * /api/localization/memory:
 *   post:
 *     summary: Add to translation memory
 *     tags: [Localization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sourceLocaleId
 *               - targetLocaleId
 *               - sourceText
 *               - targetText
 *             properties:
 *               sourceLocaleId:
 *                 type: string
 *               targetLocaleId:
 *                 type: string
 *               sourceText:
 *                 type: string
 *               targetText:
 *                 type: string
 *               quality:
 *                 type: string
 *     responses:
 *       201:
 *         description: Added to translation memory successfully
 */
router.post('/memory', authenticate, localizationController.addToTranslationMemory.bind(localizationController));

/**
 * @swagger
 * /api/localization/memory/similar:
 *   get:
 *     summary: Find similar translations
 *     tags: [Localization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sourceText
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: sourceLocaleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: targetLocaleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Similar translations retrieved successfully
 */
router.get('/memory/similar', authenticate, localizationController.findSimilarTranslations.bind(localizationController));

// GLOSSARY
/**
 * @swagger
 * /api/localization/glossary:
 *   post:
 *     summary: Create glossary term
 *     tags: [Localization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - term
 *             properties:
 *               term:
 *                 type: string
 *               definition:
 *                 type: string
 *               category:
 *                 type: string
 *               domain:
 *                 type: string
 *     responses:
 *       201:
 *         description: Glossary term created successfully
 */
router.post('/glossary', authenticate, localizationController.createGlossaryTerm.bind(localizationController));

/**
 * @swagger
 * /api/localization/glossary:
 *   get:
 *     summary: List glossary terms
 *     tags: [Localization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Glossary terms retrieved successfully
 */
router.get('/glossary', authenticate, localizationController.listGlossaryTerms.bind(localizationController));

/**
 * @swagger
 * /api/localization/glossary/translations:
 *   post:
 *     summary: Add glossary translation
 *     tags: [Localization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - termId
 *               - localeId
 *               - translatedTerm
 *             properties:
 *               termId:
 *                 type: string
 *               localeId:
 *                 type: string
 *               translatedTerm:
 *                 type: string
 *               translatedDefinition:
 *                 type: string
 *     responses:
 *       201:
 *         description: Glossary translation added successfully
 */
router.post('/glossary/translations', authenticate, localizationController.addGlossaryTranslation.bind(localizationController));

export default router;
