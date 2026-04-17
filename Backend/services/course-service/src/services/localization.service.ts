import pool from "../db/pool";

export class LocalizationService {
  // LOCALES
  async listLocales(activeOnly: boolean = true): Promise<any[]> {
    let query = `SELECT * FROM locales WHERE 1=1`;
    if (activeOnly) query += ` AND is_active = true`;
    query += ` ORDER BY sort_order, name`;
    const result = await pool.query(query);
    return result.rows;
  }

  async getLocale(localeId: string): Promise<any> {
    const result = await pool.query(`SELECT * FROM locales WHERE id = $1`, [
      localeId,
    ]);
    return result.rows[0];
  }

  async getLocaleByCode(code: string): Promise<any> {
    const result = await pool.query(`SELECT * FROM locales WHERE code = $1`, [
      code,
    ]);
    return result.rows[0];
  }

  async createLocale(params: any): Promise<any> {
    const {
      code,
      name,
      nativeName,
      languageCode,
      countryCode,
      direction,
      isRtl,
    } = params;
    const result = await pool.query(
      `INSERT INTO locales (code, name, native_name, language_code, country_code, direction, is_rtl)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [code, name, nativeName, languageCode, countryCode, direction, isRtl],
    );
    return result.rows[0];
  }

  async updateLocale(localeId: string, updates: any): Promise<any> {
    const { name, nativeName, dateFormat, timeFormat, isActive } = updates;
    const result = await pool.query(
      `UPDATE locales SET name = COALESCE($2, name), native_name = COALESCE($3, native_name),
      date_format = COALESCE($4, date_format), time_format = COALESCE($5, time_format),
      is_active = COALESCE($6, is_active), updated_at = NOW() WHERE id = $1 RETURNING *`,
      [localeId, name, nativeName, dateFormat, timeFormat, isActive],
    );
    return result.rows[0];
  }

  // TRANSLATION KEYS
  async createTranslationKey(params: any): Promise<any> {
    const {
      key,
      namespace,
      description,
      context,
      supportsPluralizations,
      variables,
    } = params;
    const result = await pool.query(
      `INSERT INTO translation_keys (key, namespace, description, context, supports_pluralization, variables)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [key, namespace, description, context, supportsPluralizations, variables],
    );
    return result.rows[0];
  }

  async listTranslationKeys(namespace?: string): Promise<any[]> {
    let query = `SELECT * FROM translation_keys WHERE is_deprecated = false`;
    const params: any[] = [];
    if (namespace) {
      query += ` AND namespace = $1`;
      params.push(namespace);
    }
    query += ` ORDER BY key`;
    const result = await pool.query(query, params);
    return result.rows;
  }

  // TRANSLATIONS
  async createTranslation(params: any, createdBy: string): Promise<any> {
    const { keyId, localeId, value, quality, status } = params;
    const result = await pool.query(
      `INSERT INTO translations (key_id, locale_id, value, quality, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [keyId, localeId, value, quality, status, createdBy],
    );
    return result.rows[0];
  }

  async getTranslation(key: string, localeCode: string): Promise<string> {
    const result = await pool.query(
      `SELECT get_translation($1, $2) as translation`,
      [key, localeCode],
    );
    return result.rows[0]?.translation || key;
  }

  async listTranslations(localeId: string, filters: any = {}): Promise<any[]> {
    const { status, namespace, limit = 1000 } = filters;
    let query = `SELECT t.*, tk.key, tk.namespace FROM translations t
                 JOIN translation_keys tk ON tk.id = t.key_id
                 WHERE t.locale_id = $1`;
    const params: any[] = [localeId];
    let paramIndex = 2;

    if (status) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (namespace) {
      query += ` AND tk.namespace = $${paramIndex}`;
      params.push(namespace);
      paramIndex++;
    }

    query += ` ORDER BY tk.key LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async updateTranslation(
    translationId: string,
    value: string,
    updatedBy: string,
  ): Promise<any> {
    const result = await pool.query(
      `UPDATE translations SET value = $2, updated_by = $3, updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [translationId, value, updatedBy],
    );
    return result.rows[0];
  }

  async approveTranslation(
    translationId: string,
    approvedBy: string,
  ): Promise<any> {
    const result = await pool.query(
      `UPDATE translations SET status = 'approved', approved_by = $2, approved_at = NOW()
      WHERE id = $1 RETURNING *`,
      [translationId, approvedBy],
    );
    return result.rows[0];
  }

  async publishTranslation(translationId: string): Promise<any> {
    const result = await pool.query(
      `UPDATE translations SET status = 'published' WHERE id = $1 RETURNING *`,
      [translationId],
    );
    return result.rows[0];
  }

  async getTranslationCompleteness(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM translation_completeness`);
    return result.rows;
  }

  async calculateCompleteness(localeId: string): Promise<number> {
    const result = await pool.query(
      `SELECT calculate_translation_completeness($1) as completeness`,
      [localeId],
    );
    return result.rows[0]?.completeness || 0;
  }

  // CONTENT LOCALIZATIONS
  async createContentLocalization(params: any): Promise<any> {
    const {
      contentType,
      contentId,
      localeId,
      title,
      description,
      body,
      translatedBy,
    } = params;
    const result = await pool.query(
      `INSERT INTO content_localizations (content_type, content_id, locale_id, title, description, body, translated_by, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'in_progress') RETURNING *`,
      [
        contentType,
        contentId,
        localeId,
        title,
        description,
        body,
        translatedBy,
      ],
    );
    return result.rows[0];
  }

  async getContentLocalization(
    contentType: string,
    contentId: string,
    localeId: string,
  ): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM content_localizations WHERE content_type = $1 AND content_id = $2 AND locale_id = $3`,
      [contentType, contentId, localeId],
    );
    return result.rows[0];
  }

  async updateContentLocalization(
    localizationId: string,
    updates: any,
  ): Promise<any> {
    const { title, description, body, status } = updates;
    const result = await pool.query(
      `UPDATE content_localizations SET title = COALESCE($2, title), description = COALESCE($3, description),
      body = COALESCE($4, body), status = COALESCE($5, status), updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [localizationId, title, description, body, status],
    );
    return result.rows[0];
  }

  async getContentLocalizationProgress(): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM content_localization_progress`,
    );
    return result.rows;
  }

  // USER PREFERENCES
  async setUserLocalePreference(
    userId: string,
    localeId: string,
    timezone?: string,
  ): Promise<any> {
    const result = await pool.query(
      `INSERT INTO user_locale_preferences (user_id, locale_id, timezone)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE SET locale_id = $2, timezone = $3, updated_at = NOW()
      RETURNING *`,
      [userId, localeId, timezone],
    );
    return result.rows[0];
  }

  async getUserLocalePreference(userId: string): Promise<any> {
    const result = await pool.query(
      `SELECT ulp.*, l.code as locale_code FROM user_locale_preferences ulp
      JOIN locales l ON l.id = ulp.locale_id WHERE ulp.user_id = $1`,
      [userId],
    );
    return result.rows[0];
  }

  // TRANSLATION MEMORY
  async addToTranslationMemory(params: any): Promise<any> {
    const {
      sourceLocaleId,
      targetLocaleId,
      sourceText,
      targetText,
      quality,
      createdBy,
    } = params;
    const result = await pool.query(
      `INSERT INTO translation_memory (source_locale_id, target_locale_id, source_text, target_text, translation_quality, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (source_locale_id, target_locale_id, source_text, context) DO UPDATE
      SET target_text = $4, usage_count = translation_memory.usage_count + 1, last_used_at = NOW()
      RETURNING *`,
      [
        sourceLocaleId,
        targetLocaleId,
        sourceText,
        targetText,
        quality,
        createdBy,
      ],
    );
    return result.rows[0];
  }

  async findSimilarTranslations(
    sourceText: string,
    sourceLocaleId: string,
    targetLocaleId: string,
  ): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM find_similar_translations($1, $2, $3, 5)`,
      [sourceText, sourceLocaleId, targetLocaleId],
    );
    return result.rows;
  }

  // GLOSSARY
  async createGlossaryTerm(params: any, createdBy: string): Promise<any> {
    const { term, definition, category, domain } = params;
    const result = await pool.query(
      `INSERT INTO glossary_terms (term, definition, category, domain, created_by)
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [term, definition, category, domain, createdBy],
    );
    return result.rows[0];
  }

  async addGlossaryTranslation(
    termId: string,
    localeId: string,
    translatedTerm: string,
    translatedDefinition?: string,
  ): Promise<any> {
    const result = await pool.query(
      `INSERT INTO glossary_translations (term_id, locale_id, translated_term, translated_definition)
      VALUES ($1, $2, $3, $4) RETURNING *`,
      [termId, localeId, translatedTerm, translatedDefinition],
    );
    return result.rows[0];
  }

  async listGlossaryTerms(category?: string): Promise<any[]> {
    let query = `SELECT * FROM glossary_terms WHERE is_active = true`;
    const params: any[] = [];
    if (category) {
      query += ` AND category = $1`;
      params.push(category);
    }
    query += ` ORDER BY term`;
    const result = await pool.query(query, params);
    return result.rows;
  }
}

export const localizationService = new LocalizationService();
