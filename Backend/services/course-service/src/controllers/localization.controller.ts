import { Request, Response } from 'express';
import { localizationService } from '../services/localization.service';

export class LocalizationController {
  // LOCALES
  async listLocales(req: Request, res: Response): Promise<void> {
    try {
      const activeOnly = req.query.activeOnly !== 'false';
      const locales = await localizationService.listLocales(activeOnly);
      res.json({ success: true, data: locales });
    } catch (error: any) {
      console.error('[listLocales] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getLocale(req: Request, res: Response): Promise<void> {
    try {
      const { localeId } = req.params;
      const locale = await localizationService.getLocale(localeId);
      if (!locale) {
        res.status(404).json({ success: false, message: 'Locale not found' });
        return;
      }
      res.json({ success: true, data: locale });
    } catch (error: any) {
      console.error('[getLocale] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createLocale(req: Request, res: Response): Promise<void> {
    try {
      const locale = await localizationService.createLocale(req.body);
      res.status(201).json({ success: true, data: locale });
    } catch (error: any) {
      console.error('[createLocale] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateLocale(req: Request, res: Response): Promise<void> {
    try {
      const { localeId } = req.params;
      const locale = await localizationService.updateLocale(localeId, req.body);
      res.json({ success: true, data: locale });
    } catch (error: any) {
      console.error('[updateLocale] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // TRANSLATION KEYS
  async createTranslationKey(req: Request, res: Response): Promise<void> {
    try {
      const key = await localizationService.createTranslationKey(req.body);
      res.status(201).json({ success: true, data: key });
    } catch (error: any) {
      console.error('[createTranslationKey] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async listTranslationKeys(req: Request, res: Response): Promise<void> {
    try {
      const namespace = req.query.namespace as string;
      const keys = await localizationService.listTranslationKeys(namespace);
      res.json({ success: true, data: keys });
    } catch (error: any) {
      console.error('[listTranslationKeys] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // TRANSLATIONS
  async createTranslation(req: Request, res: Response): Promise<void> {
    try {
      const createdBy = (req as any).user?.userId || 'system';
      const translation = await localizationService.createTranslation(req.body, createdBy);
      res.status(201).json({ success: true, data: translation });
    } catch (error: any) {
      console.error('[createTranslation] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getTranslation(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const localeCode = (req.query.locale as string) || 'en';
      const translation = await localizationService.getTranslation(key, localeCode);
      res.json({ success: true, data: { key, translation } });
    } catch (error: any) {
      console.error('[getTranslation] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async listTranslations(req: Request, res: Response): Promise<void> {
    try {
      const { localeId } = req.params;
      const filters = {
        status: req.query.status as string,
        namespace: req.query.namespace as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 1000
      };
      const translations = await localizationService.listTranslations(localeId, filters);
      res.json({ success: true, data: translations });
    } catch (error: any) {
      console.error('[listTranslations] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateTranslation(req: Request, res: Response): Promise<void> {
    try {
      const updatedBy = (req as any).user?.userId || 'system';
      const { translationId } = req.params;
      const { value } = req.body;
      const translation = await localizationService.updateTranslation(translationId, value, updatedBy);
      res.json({ success: true, data: translation });
    } catch (error: any) {
      console.error('[updateTranslation] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async approveTranslation(req: Request, res: Response): Promise<void> {
    try {
      const approvedBy = (req as any).user?.userId || 'system';
      const { translationId } = req.params;
      const translation = await localizationService.approveTranslation(translationId, approvedBy);
      res.json({ success: true, data: translation });
    } catch (error: any) {
      console.error('[approveTranslation] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async publishTranslation(req: Request, res: Response): Promise<void> {
    try {
      const { translationId } = req.params;
      const translation = await localizationService.publishTranslation(translationId);
      res.json({ success: true, data: translation });
    } catch (error: any) {
      console.error('[publishTranslation] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getTranslationCompleteness(req: Request, res: Response): Promise<void> {
    try {
      const completeness = await localizationService.getTranslationCompleteness();
      res.json({ success: true, data: completeness });
    } catch (error: any) {
      console.error('[getTranslationCompleteness] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // CONTENT LOCALIZATIONS
  async createContentLocalization(req: Request, res: Response): Promise<void> {
    try {
      const localization = await localizationService.createContentLocalization(req.body);
      res.status(201).json({ success: true, data: localization });
    } catch (error: any) {
      console.error('[createContentLocalization] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getContentLocalization(req: Request, res: Response): Promise<void> {
    try {
      const { contentType, contentId, localeId } = req.params;
      const localization = await localizationService.getContentLocalization(contentType, contentId, localeId);
      if (!localization) {
        res.status(404).json({ success: false, message: 'Localization not found' });
        return;
      }
      res.json({ success: true, data: localization });
    } catch (error: any) {
      console.error('[getContentLocalization] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateContentLocalization(req: Request, res: Response): Promise<void> {
    try {
      const { localizationId } = req.params;
      const localization = await localizationService.updateContentLocalization(localizationId, req.body);
      res.json({ success: true, data: localization });
    } catch (error: any) {
      console.error('[updateContentLocalization] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getContentLocalizationProgress(req: Request, res: Response): Promise<void> {
    try {
      const progress = await localizationService.getContentLocalizationProgress();
      res.json({ success: true, data: progress });
    } catch (error: any) {
      console.error('[getContentLocalizationProgress] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // USER PREFERENCES
  async setUserLocalePreference(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const { localeId, timezone } = req.body;
      const preference = await localizationService.setUserLocalePreference(userId, localeId, timezone);
      res.json({ success: true, data: preference });
    } catch (error: any) {
      console.error('[setUserLocalePreference] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getUserLocalePreference(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const preference = await localizationService.getUserLocalePreference(userId);
      res.json({ success: true, data: preference });
    } catch (error: any) {
      console.error('[getUserLocalePreference] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // TRANSLATION MEMORY
  async addToTranslationMemory(req: Request, res: Response): Promise<void> {
    try {
      const createdBy = (req as any).user?.userId || 'system';
      const memory = await localizationService.addToTranslationMemory({ ...req.body, createdBy });
      res.status(201).json({ success: true, data: memory });
    } catch (error: any) {
      console.error('[addToTranslationMemory] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async findSimilarTranslations(req: Request, res: Response): Promise<void> {
    try {
      const { sourceText, sourceLocaleId, targetLocaleId } = req.query;
      if (!sourceText || !sourceLocaleId || !targetLocaleId) {
        res.status(400).json({ success: false, message: 'Missing required parameters' });
        return;
      }
      const similar = await localizationService.findSimilarTranslations(
        sourceText as string,
        sourceLocaleId as string,
        targetLocaleId as string
      );
      res.json({ success: true, data: similar });
    } catch (error: any) {
      console.error('[findSimilarTranslations] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // GLOSSARY
  async createGlossaryTerm(req: Request, res: Response): Promise<void> {
    try {
      const createdBy = (req as any).user?.userId || 'system';
      const term = await localizationService.createGlossaryTerm(req.body, createdBy);
      res.status(201).json({ success: true, data: term });
    } catch (error: any) {
      console.error('[createGlossaryTerm] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async addGlossaryTranslation(req: Request, res: Response): Promise<void> {
    try {
      const { termId, localeId, translatedTerm, translatedDefinition } = req.body;
      const translation = await localizationService.addGlossaryTranslation(termId, localeId, translatedTerm, translatedDefinition);
      res.status(201).json({ success: true, data: translation });
    } catch (error: any) {
      console.error('[addGlossaryTranslation] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async listGlossaryTerms(req: Request, res: Response): Promise<void> {
    try {
      const category = req.query.category as string;
      const terms = await localizationService.listGlossaryTerms(category);
      res.json({ success: true, data: terms });
    } catch (error: any) {
      console.error('[listGlossaryTerms] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const localizationController = new LocalizationController();
