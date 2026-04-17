import pool from '../db/pool';

export class SearchService {
  // SEARCH OPERATIONS
  async search(query: string, options: any = {}): Promise<any> {
    const {
      entityTypes, limit = 20, offset = 0, userId, filters = {}, sort = 'relevance'
    } = options;

    // Record the search query
    const queryId = await this.recordSearchQuery(query, userId, options);

    // Perform search using PostgreSQL full-text search
    let searchQuery = `SELECT * FROM search_content($1, $2, $3, $4)`;
    const params: any[] = [query, entityTypes, limit, offset];

    const result = await pool.query(searchQuery, params);
    const results = result.rows;

    // Update results count
    await pool.query(
      `UPDATE search_queries SET results_count = $2 WHERE id = $1`,
      [queryId, results.length]
    );

    return {
      queryId,
      query,
      results,
      total: results.length,
      limit,
      offset
    };
  }

  async advancedSearch(params: any): Promise<any> {
    const {
      query, entityTypes, filters, sort, limit = 20, offset = 0, userId
    } = params;

    let whereConditions = ['si.is_published = true', 'si.is_searchable = true'];
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Full-text search
    if (query) {
      whereConditions.push(`si.combined_vector @@ plainto_tsquery('english', $${paramIndex})`);
      queryParams.push(query);
      paramIndex++;
    }

    // Entity types
    if (entityTypes && entityTypes.length > 0) {
      whereConditions.push(`si.entity_type = ANY($${paramIndex})`);
      queryParams.push(entityTypes);
      paramIndex++;
    }

    // Filters
    if (filters.categories && filters.categories.length > 0) {
      whereConditions.push(`si.categories && $${paramIndex}`);
      queryParams.push(filters.categories);
      paramIndex++;
    }

    if (filters.tags && filters.tags.length > 0) {
      whereConditions.push(`si.tags && $${paramIndex}`);
      queryParams.push(filters.tags);
      paramIndex++;
    }

    if (filters.minRating) {
      whereConditions.push(`si.rating >= $${paramIndex}`);
      queryParams.push(filters.minRating);
      paramIndex++;
    }

    if (filters.language) {
      whereConditions.push(`si.language = $${paramIndex}`);
      queryParams.push(filters.language);
      paramIndex++;
    }

    if (filters.authorId) {
      whereConditions.push(`si.author_id = $${paramIndex}`);
      queryParams.push(filters.authorId);
      paramIndex++;
    }

    // Build ORDER BY
    let orderBy = '';
    if (query) {
      orderBy = `ts_rank(si.combined_vector, plainto_tsquery('english', $1)) * (1 + LOG(1 + si.popularity_score)) DESC`;
    } else if (sort === 'popular') {
      orderBy = 'si.popularity_score DESC';
    } else if (sort === 'recent') {
      orderBy = 'si.created_date DESC';
    } else if (sort === 'rating') {
      orderBy = 'si.rating DESC NULLS LAST';
    } else {
      orderBy = 'si.popularity_score DESC';
    }

    const searchQuery = `
      SELECT
        si.entity_type,
        si.entity_id,
        si.title,
        si.description,
        si.tags,
        si.categories,
        si.author_name,
        si.rating,
        si.popularity_score,
        si.created_date
      FROM search_index si
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const result = await pool.query(searchQuery, queryParams);

    // Record search
    if (userId) {
      await this.recordSearchQuery(query || '', userId, params);
    }

    return {
      results: result.rows,
      total: result.rows.length,
      limit,
      offset
    };
  }

  async recordSearchQuery(query: string, userId?: string, options: any = {}): Promise<string> {
    const {
      sessionId, filters, resultsCount = 0, pageUrl, referrer, userAgent, ipAddress
    } = options;

    const queryNormalized = query.toLowerCase().trim();
    const result = await pool.query(
      `INSERT INTO search_queries (
        user_id, session_id, query_text, query_normalized, search_filters,
        results_count, page_url, referrer, user_agent, ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        userId, sessionId, query, queryNormalized, filters,
        resultsCount, pageUrl, referrer, userAgent, ipAddress
      ]
    );

    return result.rows[0].id;
  }

  async recordSearchClick(data: any): Promise<any> {
    const {
      queryId, entityType, entityId, resultPosition, resultScore,
      timeToClickMs, userId, sessionId
    } = data;

    const result = await pool.query(
      `INSERT INTO search_result_clicks (
        query_id, entity_type, entity_id, result_position, result_score,
        time_to_click_ms, user_id, session_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [queryId, entityType, entityId, resultPosition, resultScore, timeToClickMs, userId, sessionId]
    );

    return result.rows[0];
  }

  // AUTO-COMPLETE
  async getSuggestions(prefix: string, limit: number = 10): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM get_search_suggestions($1, $2)`,
      [prefix, limit]
    );
    return result.rows;
  }

  async createSuggestion(data: any): Promise<any> {
    const {
      suggestionText, suggestionType, entityType, entityId, language
    } = data;

    const suggestionNormalized = suggestionText.toLowerCase().trim();
    const result = await pool.query(
      `INSERT INTO search_suggestions (
        suggestion_text, suggestion_normalized, suggestion_type,
        entity_type, entity_id, language
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (suggestion_normalized, language) DO UPDATE SET
        usage_count = search_suggestions.usage_count + 1,
        updated_at = NOW()
      RETURNING *`,
      [suggestionText, suggestionNormalized, suggestionType, entityType, entityId, language]
    );

    return result.rows[0];
  }

  async updateSuggestionMetrics(suggestionId: string, clicked: boolean): Promise<any> {
    const updateField = clicked ? 'click_count = click_count + 1' : 'usage_count = usage_count + 1';
    const result = await pool.query(
      `UPDATE search_suggestions SET ${updateField}, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [suggestionId]
    );

    return result.rows[0];
  }

  // SAVED SEARCHES
  async createSavedSearch(data: any): Promise<any> {
    const {
      userId, searchName, queryText, searchFilters, entityTypes,
      enableNotifications, notificationFrequency
    } = data;

    const result = await pool.query(
      `INSERT INTO saved_searches (
        user_id, search_name, query_text, search_filters, entity_types,
        enable_notifications, notification_frequency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [userId, searchName, queryText, searchFilters, entityTypes, enableNotifications, notificationFrequency]
    );

    return result.rows[0];
  }

  async listSavedSearches(userId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM saved_searches WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async getSavedSearch(searchId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM saved_searches WHERE id = $1`,
      [searchId]
    );
    return result.rows[0];
  }

  async updateSavedSearch(searchId: string, updates: any): Promise<any> {
    const { searchName, enableNotifications, notificationFrequency, isActive } = updates;

    const result = await pool.query(
      `UPDATE saved_searches SET
        search_name = COALESCE($2, search_name),
        enable_notifications = COALESCE($3, enable_notifications),
        notification_frequency = COALESCE($4, notification_frequency),
        is_active = COALESCE($5, is_active),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [searchId, searchName, enableNotifications, notificationFrequency, isActive]
    );

    return result.rows[0];
  }

  async deleteSavedSearch(searchId: string): Promise<void> {
    await pool.query(`DELETE FROM saved_searches WHERE id = $1`, [searchId]);
  }

  async executeSavedSearch(searchId: string): Promise<any> {
    const savedSearch = await this.getSavedSearch(searchId);
    if (!savedSearch) {
      throw new Error('Saved search not found');
    }

    // Execute the search
    const results = await this.advancedSearch({
      query: savedSearch.query_text,
      filters: savedSearch.search_filters,
      entityTypes: savedSearch.entity_types,
      userId: savedSearch.user_id
    });

    // Update execution metrics
    await pool.query(
      `UPDATE saved_searches SET
        last_executed_at = NOW(),
        execution_count = execution_count + 1,
        result_count = $2
      WHERE id = $1`,
      [searchId, results.total]
    );

    return results;
  }

  // TRENDING & ANALYTICS
  async getTrendingSearches(period: string = 'daily', limit: number = 10): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM trending_searches
       WHERE period_type = $1 AND is_trending = true
       ORDER BY trending_score DESC
       LIMIT $2`,
      [period, limit]
    );
    return result.rows;
  }

  async getPopularSearches(limit: number = 20): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM popular_searches LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async getFailedSearches(limit: number = 20): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM failed_searches LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async getSearchPerformance(days: number = 30): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM search_performance WHERE date >= CURRENT_DATE - $1 ORDER BY date DESC`,
      [days]
    );
    return result.rows;
  }

  async getSearchAnalytics(filters: any = {}): Promise<any[]> {
    const { startDate, endDate, hour } = filters;
    let query = `SELECT * FROM search_analytics WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (startDate) {
      query += ` AND date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    if (hour !== undefined) {
      query += ` AND hour = $${paramIndex}`;
      params.push(hour);
      paramIndex++;
    }

    query += ` ORDER BY date DESC, hour DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getUserSearchHistory(userId: string, limit: number = 50): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM search_queries
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  // CONTENT RECOMMENDATIONS
  async getRecommendations(userId: string, options: any = {}): Promise<any[]> {
    const { limit = 10, source, entityType } = options;
    let query = `SELECT * FROM content_recommendations WHERE user_id = $1 AND displayed = false`;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (source) {
      query += ` AND recommendation_source = $${paramIndex}`;
      params.push(source);
      paramIndex++;
    }

    if (entityType) {
      query += ` AND recommended_entity_type = $${paramIndex}`;
      params.push(entityType);
      paramIndex++;
    }

    query += ` ORDER BY confidence_score DESC, relevance_score DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async createRecommendation(data: any): Promise<any> {
    const {
      userId, sourceEntityType, sourceEntityId, recommendedEntityType,
      recommendedEntityId, recommendationSource, confidenceScore, relevanceScore,
      factors, expiresAt
    } = data;

    const result = await pool.query(
      `INSERT INTO content_recommendations (
        user_id, source_entity_type, source_entity_id, recommended_entity_type,
        recommended_entity_id, recommendation_source, confidence_score, relevance_score,
        factors, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        userId, sourceEntityType, sourceEntityId, recommendedEntityType,
        recommendedEntityId, recommendationSource, confidenceScore, relevanceScore,
        factors, expiresAt
      ]
    );

    return result.rows[0];
  }

  async markRecommendationDisplayed(recommendationId: string): Promise<any> {
    const result = await pool.query(
      `UPDATE content_recommendations SET
        displayed = true,
        displayed_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [recommendationId]
    );

    return result.rows[0];
  }

  async markRecommendationClicked(recommendationId: string): Promise<any> {
    const result = await pool.query(
      `UPDATE content_recommendations SET
        clicked = true,
        clicked_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [recommendationId]
    );

    return result.rows[0];
  }

  // SEARCH INDEX MANAGEMENT
  async addToSearchIndex(data: any): Promise<any> {
    const {
      entityType, entityId, title, description, content, tags, categories,
      authorId, authorName, viewCount, enrollmentCount, rating, visibility,
      organizationId, language
    } = data;

    const result = await pool.query(
      `INSERT INTO search_index (
        entity_type, entity_id, title, description, content, tags, categories,
        author_id, author_name, view_count, enrollment_count, rating, visibility,
        organization_id, language, created_date, modified_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_DATE, CURRENT_DATE)
      ON CONFLICT (entity_type, entity_id) DO UPDATE SET
        title = $3,
        description = $4,
        content = $5,
        tags = $6,
        categories = $7,
        author_id = $8,
        author_name = $9,
        view_count = $10,
        enrollment_count = $11,
        rating = $12,
        modified_date = CURRENT_DATE
      RETURNING *`,
      [
        entityType, entityId, title, description, content, tags, categories,
        authorId, authorName, viewCount, enrollmentCount, rating, visibility,
        organizationId, language
      ]
    );

    return result.rows[0];
  }

  async updateSearchIndex(entityType: string, entityId: string, updates: any): Promise<any> {
    const {
      title, description, content, tags, categories, viewCount, enrollmentCount, rating
    } = updates;

    const result = await pool.query(
      `UPDATE search_index SET
        title = COALESCE($3, title),
        description = COALESCE($4, description),
        content = COALESCE($5, content),
        tags = COALESCE($6, tags),
        categories = COALESCE($7, categories),
        view_count = COALESCE($8, view_count),
        enrollment_count = COALESCE($9, enrollment_count),
        rating = COALESCE($10, rating),
        modified_date = CURRENT_DATE
      WHERE entity_type = $1 AND entity_id = $2
      RETURNING *`,
      [
        entityType, entityId, title, description, content, tags, categories,
        viewCount, enrollmentCount, rating
      ]
    );

    return result.rows[0];
  }

  async removeFromSearchIndex(entityType: string, entityId: string): Promise<void> {
    await pool.query(
      `DELETE FROM search_index WHERE entity_type = $1 AND entity_id = $2`,
      [entityType, entityId]
    );
  }

  async updatePopularityScore(entityType: string, entityId: string): Promise<any> {
    const result = await pool.query(
      `UPDATE search_index
       SET popularity_score = (
         COALESCE(view_count, 0) * 0.3 +
         COALESCE(enrollment_count, 0) * 0.5 +
         COALESCE(rating, 0) * 4 * 0.2
       )
       WHERE entity_type = $1 AND entity_id = $2
       RETURNING *`,
      [entityType, entityId]
    );

    return result.rows[0];
  }

  // FACETS
  async getFacets(entityTypes?: string[]): Promise<any[]> {
    let query = `SELECT * FROM search_facets WHERE is_visible = true`;
    const params: any[] = [];

    if (entityTypes && entityTypes.length > 0) {
      query += ` AND applicable_entity_types && $1`;
      params.push(entityTypes);
    }

    query += ` ORDER BY display_order`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async createFacet(data: any): Promise<any> {
    const {
      facetKey, facetName, facetType, facetGroup, options, minValue, maxValue,
      stepValue, displayOrder, isVisible, isExpanded, applicableEntityTypes
    } = data;

    const result = await pool.query(
      `INSERT INTO search_facets (
        facet_key, facet_name, facet_type, facet_group, options, min_value,
        max_value, step_value, display_order, is_visible, is_expanded,
        applicable_entity_types
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        facetKey, facetName, facetType, facetGroup, options, minValue, maxValue,
        stepValue, displayOrder, isVisible, isExpanded, applicableEntityTypes
      ]
    );

    return result.rows[0];
  }

  // USER PREFERENCES
  async getUserSearchPreferences(userId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM user_search_preferences WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }

  async updateUserSearchPreferences(userId: string, preferences: any): Promise<any> {
    const {
      defaultEntityTypes, defaultSort, resultsPerPage, enableAutoComplete,
      enableSearchHistory, preferredLanguages, preferredDifficultyLevels,
      excludedCategories, shareSearchHistory, personalizeResults
    } = preferences;

    const result = await pool.query(
      `INSERT INTO user_search_preferences (
        user_id, default_entity_types, default_sort, results_per_page, enable_auto_complete,
        enable_search_history, preferred_languages, preferred_difficulty_levels,
        excluded_categories, share_search_history, personalize_results
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (user_id) DO UPDATE SET
        default_entity_types = $2,
        default_sort = $3,
        results_per_page = $4,
        enable_auto_complete = $5,
        enable_search_history = $6,
        preferred_languages = $7,
        preferred_difficulty_levels = $8,
        excluded_categories = $9,
        share_search_history = $10,
        personalize_results = $11,
        updated_at = NOW()
      RETURNING *`,
      [
        userId, defaultEntityTypes, defaultSort, resultsPerPage, enableAutoComplete,
        enableSearchHistory, preferredLanguages, preferredDifficultyLevels,
        excludedCategories, shareSearchHistory, personalizeResults
      ]
    );

    return result.rows[0];
  }

  // SYNONYMS
  async createSynonym(data: any): Promise<any> {
    const { groupName, terms, synonymType, baseTerm, language, createdBy } = data;

    const result = await pool.query(
      `INSERT INTO search_synonyms (
        group_name, terms, synonym_type, base_term, language, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [groupName, terms, synonymType, baseTerm, language, createdBy]
    );

    return result.rows[0];
  }

  async listSynonyms(language?: string): Promise<any[]> {
    let query = `SELECT * FROM search_synonyms WHERE is_active = true`;
    const params: any[] = [];

    if (language) {
      query += ` AND language = $1`;
      params.push(language);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  // STOPWORDS
  async createStopword(word: string, language: string = 'en'): Promise<any> {
    const result = await pool.query(
      `INSERT INTO search_stopwords (word, language)
       VALUES ($1, $2)
       ON CONFLICT (word, language) DO UPDATE SET is_active = true
       RETURNING *`,
      [word, language]
    );

    return result.rows[0];
  }

  async listStopwords(language?: string): Promise<any[]> {
    let query = `SELECT * FROM search_stopwords WHERE is_active = true`;
    const params: any[] = [];

    if (language) {
      query += ` AND language = $1`;
      params.push(language);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }
}

export const searchService = new SearchService();
