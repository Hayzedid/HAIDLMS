import { Request, Response } from 'express';
import { searchService } from '../services/search.service';

export class SearchController {
  // SEARCH OPERATIONS
  async search(req: Request, res: Response): Promise<void> {
    try {
      const { q: query } = req.query;
      if (!query) {
        res.status(400).json({ success: false, message: 'Query parameter required' });
        return;
      }

      const userId = (req as any).user?.userId;
      const options = {
        entityTypes: req.query.entityTypes ? (req.query.entityTypes as string).split(',') : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
        userId,
        filters: req.query.filters ? JSON.parse(req.query.filters as string) : {},
        sort: req.query.sort as string
      };

      const results = await searchService.search(query as string, options);
      res.json({ success: true, data: results });
    } catch (error: any) {
      console.error('[search] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async advancedSearch(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const params = { ...req.body, userId };
      const results = await searchService.advancedSearch(params);
      res.json({ success: true, data: results });
    } catch (error: any) {
      console.error('[advancedSearch] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async recordSearchClick(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const click = await searchService.recordSearchClick({ ...req.body, userId });
      res.json({ success: true, data: click });
    } catch (error: any) {
      console.error('[recordSearchClick] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // AUTO-COMPLETE
  async getSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const { prefix } = req.query;
      if (!prefix) {
        res.status(400).json({ success: false, message: 'Prefix parameter required' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const suggestions = await searchService.getSuggestions(prefix as string, limit);
      res.json({ success: true, data: suggestions });
    } catch (error: any) {
      console.error('[getSuggestions] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createSuggestion(req: Request, res: Response): Promise<void> {
    try {
      const suggestion = await searchService.createSuggestion(req.body);
      res.status(201).json({ success: true, data: suggestion });
    } catch (error: any) {
      console.error('[createSuggestion] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // SAVED SEARCHES
  async createSavedSearch(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const search = await searchService.createSavedSearch({ ...req.body, userId });
      res.status(201).json({ success: true, data: search });
    } catch (error: any) {
      console.error('[createSavedSearch] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async listSavedSearches(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const searches = await searchService.listSavedSearches(userId);
      res.json({ success: true, data: searches });
    } catch (error: any) {
      console.error('[listSavedSearches] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getSavedSearch(req: Request, res: Response): Promise<void> {
    try {
      const { searchId } = req.params;
      const search = await searchService.getSavedSearch(searchId);
      if (!search) {
        res.status(404).json({ success: false, message: 'Saved search not found' });
        return;
      }
      res.json({ success: true, data: search });
    } catch (error: any) {
      console.error('[getSavedSearch] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateSavedSearch(req: Request, res: Response): Promise<void> {
    try {
      const { searchId } = req.params;
      const search = await searchService.updateSavedSearch(searchId, req.body);
      res.json({ success: true, data: search });
    } catch (error: any) {
      console.error('[updateSavedSearch] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteSavedSearch(req: Request, res: Response): Promise<void> {
    try {
      const { searchId } = req.params;
      await searchService.deleteSavedSearch(searchId);
      res.json({ success: true, message: 'Saved search deleted successfully' });
    } catch (error: any) {
      console.error('[deleteSavedSearch] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async executeSavedSearch(req: Request, res: Response): Promise<void> {
    try {
      const { searchId } = req.params;
      const results = await searchService.executeSavedSearch(searchId);
      res.json({ success: true, data: results });
    } catch (error: any) {
      console.error('[executeSavedSearch] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // TRENDING & ANALYTICS
  async getTrendingSearches(req: Request, res: Response): Promise<void> {
    try {
      const period = req.query.period as string || 'daily';
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const trending = await searchService.getTrendingSearches(period, limit);
      res.json({ success: true, data: trending });
    } catch (error: any) {
      console.error('[getTrendingSearches] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPopularSearches(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const popular = await searchService.getPopularSearches(limit);
      res.json({ success: true, data: popular });
    } catch (error: any) {
      console.error('[getPopularSearches] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getFailedSearches(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const failed = await searchService.getFailedSearches(limit);
      res.json({ success: true, data: failed });
    } catch (error: any) {
      console.error('[getFailedSearches] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getSearchPerformance(req: Request, res: Response): Promise<void> {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : undefined;
      const performance = await searchService.getSearchPerformance(days);
      res.json({ success: true, data: performance });
    } catch (error: any) {
      console.error('[getSearchPerformance] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getSearchAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        hour: req.query.hour ? parseInt(req.query.hour as string, 10) : undefined
      };
      const analytics = await searchService.getSearchAnalytics(filters);
      res.json({ success: true, data: analytics });
    } catch (error: any) {
      console.error('[getSearchAnalytics] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getUserSearchHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const history = await searchService.getUserSearchHistory(userId, limit);
      res.json({ success: true, data: history });
    } catch (error: any) {
      console.error('[getUserSearchHistory] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // RECOMMENDATIONS
  async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const options = {
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        source: req.query.source as string,
        entityType: req.query.entityType as string
      };

      const recommendations = await searchService.getRecommendations(userId, options);
      res.json({ success: true, data: recommendations });
    } catch (error: any) {
      console.error('[getRecommendations] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createRecommendation(req: Request, res: Response): Promise<void> {
    try {
      const recommendation = await searchService.createRecommendation(req.body);
      res.status(201).json({ success: true, data: recommendation });
    } catch (error: any) {
      console.error('[createRecommendation] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async markRecommendationDisplayed(req: Request, res: Response): Promise<void> {
    try {
      const { recommendationId } = req.params;
      const recommendation = await searchService.markRecommendationDisplayed(recommendationId);
      res.json({ success: true, data: recommendation });
    } catch (error: any) {
      console.error('[markRecommendationDisplayed] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async markRecommendationClicked(req: Request, res: Response): Promise<void> {
    try {
      const { recommendationId } = req.params;
      const recommendation = await searchService.markRecommendationClicked(recommendationId);
      res.json({ success: true, data: recommendation });
    } catch (error: any) {
      console.error('[markRecommendationClicked] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // SEARCH INDEX MANAGEMENT
  async addToSearchIndex(req: Request, res: Response): Promise<void> {
    try {
      const indexEntry = await searchService.addToSearchIndex(req.body);
      res.status(201).json({ success: true, data: indexEntry });
    } catch (error: any) {
      console.error('[addToSearchIndex] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateSearchIndex(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.params;
      const indexEntry = await searchService.updateSearchIndex(entityType, entityId, req.body);
      res.json({ success: true, data: indexEntry });
    } catch (error: any) {
      console.error('[updateSearchIndex] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async removeFromSearchIndex(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.params;
      await searchService.removeFromSearchIndex(entityType, entityId);
      res.json({ success: true, message: 'Removed from search index successfully' });
    } catch (error: any) {
      console.error('[removeFromSearchIndex] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updatePopularityScore(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.params;
      const indexEntry = await searchService.updatePopularityScore(entityType, entityId);
      res.json({ success: true, data: indexEntry });
    } catch (error: any) {
      console.error('[updatePopularityScore] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // FACETS
  async getFacets(req: Request, res: Response): Promise<void> {
    try {
      const entityTypes = req.query.entityTypes ? (req.query.entityTypes as string).split(',') : undefined;
      const facets = await searchService.getFacets(entityTypes);
      res.json({ success: true, data: facets });
    } catch (error: any) {
      console.error('[getFacets] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createFacet(req: Request, res: Response): Promise<void> {
    try {
      const facet = await searchService.createFacet(req.body);
      res.status(201).json({ success: true, data: facet });
    } catch (error: any) {
      console.error('[createFacet] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // USER PREFERENCES
  async getUserSearchPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const preferences = await searchService.getUserSearchPreferences(userId);
      res.json({ success: true, data: preferences });
    } catch (error: any) {
      console.error('[getUserSearchPreferences] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateUserSearchPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const preferences = await searchService.updateUserSearchPreferences(userId, req.body);
      res.json({ success: true, data: preferences });
    } catch (error: any) {
      console.error('[updateUserSearchPreferences] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // SYNONYMS
  async createSynonym(req: Request, res: Response): Promise<void> {
    try {
      const createdBy = (req as any).user?.userId;
      const synonym = await searchService.createSynonym({ ...req.body, createdBy });
      res.status(201).json({ success: true, data: synonym });
    } catch (error: any) {
      console.error('[createSynonym] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async listSynonyms(req: Request, res: Response): Promise<void> {
    try {
      const language = req.query.language as string;
      const synonyms = await searchService.listSynonyms(language);
      res.json({ success: true, data: synonyms });
    } catch (error: any) {
      console.error('[listSynonyms] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // STOPWORDS
  async createStopword(req: Request, res: Response): Promise<void> {
    try {
      const { word, language } = req.body;
      const stopword = await searchService.createStopword(word, language);
      res.status(201).json({ success: true, data: stopword });
    } catch (error: any) {
      console.error('[createStopword] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async listStopwords(req: Request, res: Response): Promise<void> {
    try {
      const language = req.query.language as string;
      const stopwords = await searchService.listStopwords(language);
      res.json({ success: true, data: stopwords });
    } catch (error: any) {
      console.error('[listStopwords] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const searchController = new SearchController();
