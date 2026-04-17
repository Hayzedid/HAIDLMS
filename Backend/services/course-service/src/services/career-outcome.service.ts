import pool from '../db/pool';

interface CareerOutcome {
  id?: string;
  userId: string;
  courseId?: string;
  certificationId?: string;
  completedAt?: Date;
  outcomeType: string;
  outcomeStatus?: string;
  previousJobTitle?: string;
  previousCompany?: string;
  previousSalaryRange?: string;
  previousEmploymentStatus?: string;
  newJobTitle?: string;
  newCompany?: string;
  newSalaryRange?: string;
  newEmploymentStatus?: string;
  timeToOutcomeDays?: number;
  outcomeDate?: Date;
  linkedinProfileUrl?: string;
  linkedinPostUrl?: string;
  linkedinVerified?: boolean;
  outcomeDescription?: string;
  skillsUsed?: string[];
  industry?: string;
  location?: string;
  jobLevel?: string;
  isPublic?: boolean;
  allowTestimonial?: boolean;
  testimonialText?: string;
  referralSource?: string;
  courseDirectlyHelped?: boolean;
}

interface OutcomeSurvey {
  userId: string;
  courseId?: string;
  surveyType: string;
  sentAt: Date;
  responses?: any;
}

interface JobPosting {
  id?: string;
  title: string;
  company: string;
  companyLogoUrl?: string;
  description: string;
  requiredSkills: string[];
  preferredSkills?: string[];
  experienceLevel?: string;
  educationLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  location?: string;
  remoteAllowed?: boolean;
  applicationUrl?: string;
  recommendedCourses?: string[];
  isActive?: boolean;
  postedAt?: Date;
  expiresAt?: Date;
}

interface OrganizationROI {
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  totalTrainingCost?: number;
  notes?: string;
}

export class CareerOutcomeService {
  // ========================================
  // CAREER OUTCOMES
  // ========================================

  async createOutcome(outcome: CareerOutcome): Promise<any> {
    const query = `
      INSERT INTO career_outcomes (
        user_id, course_id, certification_id, completed_at, outcome_type,
        outcome_status, previous_job_title, previous_company, previous_salary_range,
        previous_employment_status, new_job_title, new_company, new_salary_range,
        new_employment_status, outcome_date, linkedin_profile_url, linkedin_post_url,
        outcome_description, skills_used, industry, location, job_level,
        is_public, allow_testimonial, testimonial_text, referral_source,
        course_directly_helped
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
      )
      RETURNING *
    `;

    const values = [
      outcome.userId,
      outcome.courseId,
      outcome.certificationId,
      outcome.completedAt,
      outcome.outcomeType,
      outcome.outcomeStatus || 'pending',
      outcome.previousJobTitle,
      outcome.previousCompany,
      outcome.previousSalaryRange,
      outcome.previousEmploymentStatus,
      outcome.newJobTitle,
      outcome.newCompany,
      outcome.newSalaryRange,
      outcome.newEmploymentStatus,
      outcome.outcomeDate,
      outcome.linkedinProfileUrl,
      outcome.linkedinPostUrl,
      outcome.outcomeDescription,
      outcome.skillsUsed,
      outcome.industry,
      outcome.location,
      outcome.jobLevel,
      outcome.isPublic !== false,
      outcome.allowTestimonial || false,
      outcome.testimonialText,
      outcome.referralSource,
      outcome.courseDirectlyHelped !== false,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getOutcome(outcomeId: string): Promise<any> {
    const query = `
      SELECT
        co.*,
        u.full_name,
        u.email,
        c.title AS course_title
      FROM career_outcomes co
      JOIN users u ON co.user_id = u.id
      LEFT JOIN courses c ON co.course_id = c.id
      WHERE co.id = $1
    `;

    const result = await pool.query(query, [outcomeId]);

    if (result.rows.length === 0) {
      throw new Error('Outcome not found');
    }

    return result.rows[0];
  }

  async getUserOutcomes(userId: string): Promise<any[]> {
    const query = `
      SELECT
        co.*,
        c.title AS course_title,
        c.thumbnail_url AS course_thumbnail
      FROM career_outcomes co
      LEFT JOIN courses c ON co.course_id = c.id
      WHERE co.user_id = $1
      ORDER BY co.outcome_date DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  async getCourseOutcomes(courseId: string, publicOnly: boolean = true): Promise<any[]> {
    let query = `
      SELECT
        co.id,
        co.outcome_type,
        co.outcome_date,
        co.new_job_title,
        co.new_company,
        co.time_to_outcome_days,
        co.testimonial_text,
        u.full_name,
        u.avatar_url
      FROM career_outcomes co
      JOIN users u ON co.user_id = u.id
      WHERE co.course_id = $1 AND co.outcome_status = 'verified'
    `;

    if (publicOnly) {
      query += ' AND co.is_public = true';
    }

    query += ' ORDER BY co.outcome_date DESC';

    const result = await pool.query(query, [courseId]);
    return result.rows;
  }

  async updateOutcome(outcomeId: string, userId: string, updates: Partial<CareerOutcome>): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'userId') {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${snakeKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = NOW()');
    values.push(outcomeId, userId);

    const query = `
      UPDATE career_outcomes
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Outcome not found or unauthorized');
    }

    return result.rows[0];
  }

  async verifyOutcome(outcomeId: string, verifierId: string, verificationMethod: string, notes?: string): Promise<any> {
    const query = `
      UPDATE career_outcomes
      SET
        outcome_status = 'verified',
        verified_by = $2,
        verified_at = NOW(),
        verification_method = $3,
        verification_notes = $4,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [outcomeId, verifierId, verificationMethod, notes]);

    if (result.rows.length === 0) {
      throw new Error('Outcome not found');
    }

    return result.rows[0];
  }

  async rejectOutcome(outcomeId: string, verifierId: string, reason: string): Promise<any> {
    const query = `
      UPDATE career_outcomes
      SET
        outcome_status = 'rejected',
        verified_by = $2,
        verified_at = NOW(),
        verification_notes = $3,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [outcomeId, verifierId, reason]);

    if (result.rows.length === 0) {
      throw new Error('Outcome not found');
    }

    return result.rows[0];
  }

  async deleteOutcome(outcomeId: string, userId: string): Promise<void> {
    const query = 'DELETE FROM career_outcomes WHERE id = $1 AND user_id = $2';
    const result = await pool.query(query, [outcomeId, userId]);

    if (result.rowCount === 0) {
      throw new Error('Outcome not found or unauthorized');
    }
  }

  // ========================================
  // OUTCOME STATISTICS
  // ========================================

  async getCourseOutcomeStats(courseId: string): Promise<any> {
    const query = 'SELECT * FROM get_course_outcome_stats($1)';
    const result = await pool.query(query, [courseId]);
    return result.rows[0] || {};
  }

  async getRecentVerifiedOutcomes(limit: number = 50): Promise<any[]> {
    const query = `
      SELECT * FROM recent_career_outcomes
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  async getOutcomesByType(outcomeType: string, limit: number = 100): Promise<any[]> {
    const query = `
      SELECT
        co.*,
        u.full_name,
        c.title AS course_title
      FROM career_outcomes co
      JOIN users u ON co.user_id = u.id
      LEFT JOIN courses c ON co.course_id = c.id
      WHERE co.outcome_type = $1 AND co.outcome_status = 'verified' AND co.is_public = true
      ORDER BY co.outcome_date DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [outcomeType, limit]);
    return result.rows;
  }

  // ========================================
  // OUTCOME SURVEYS
  // ========================================

  async createSurvey(survey: OutcomeSurvey): Promise<any> {
    const query = `
      INSERT INTO outcome_surveys (
        user_id, course_id, survey_type, sent_at
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [
      survey.userId,
      survey.courseId,
      survey.surveyType,
      survey.sentAt,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async completeSurvey(surveyId: string, responses: any, outcomeReported: boolean = false, outcomeId?: string): Promise<any> {
    const query = `
      UPDATE outcome_surveys
      SET
        completed_at = NOW(),
        responses = $2,
        outcome_reported = $3,
        outcome_id = $4
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [surveyId, responses, outcomeReported, outcomeId]);

    if (result.rows.length === 0) {
      throw new Error('Survey not found');
    }

    return result.rows[0];
  }

  async getPendingSurveys(userId: string): Promise<any[]> {
    const query = `
      SELECT * FROM outcome_surveys
      WHERE user_id = $1 AND completed_at IS NULL
      ORDER BY sent_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // ========================================
  // JOB POSTINGS
  // ========================================

  async createJobPosting(job: JobPosting): Promise<any> {
    const query = `
      INSERT INTO job_postings (
        title, company, company_logo_url, description, required_skills,
        preferred_skills, experience_level, education_level, salary_min,
        salary_max, salary_currency, location, remote_allowed,
        application_url, recommended_courses, is_active, posted_at, expires_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      )
      RETURNING *
    `;

    const values = [
      job.title,
      job.company,
      job.companyLogoUrl,
      job.description,
      job.requiredSkills,
      job.preferredSkills,
      job.experienceLevel,
      job.educationLevel,
      job.salaryMin,
      job.salaryMax,
      job.salaryCurrency || 'USD',
      job.location,
      job.remoteAllowed || false,
      job.applicationUrl,
      job.recommendedCourses,
      job.isActive !== false,
      job.postedAt || new Date(),
      job.expiresAt,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getJobPostings(filters: {
    skills?: string[];
    experienceLevel?: string;
    location?: string;
    remoteOnly?: boolean;
    limit?: number;
  } = {}): Promise<any[]> {
    let query = `
      SELECT * FROM job_postings
      WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW())
    `;

    const values: any[] = [];
    let paramCount = 1;

    if (filters.skills && filters.skills.length > 0) {
      query += ` AND required_skills && $${paramCount}`;
      values.push(filters.skills);
      paramCount++;
    }

    if (filters.experienceLevel) {
      query += ` AND experience_level = $${paramCount}`;
      values.push(filters.experienceLevel);
      paramCount++;
    }

    if (filters.location) {
      query += ` AND location ILIKE $${paramCount}`;
      values.push(`%${filters.location}%`);
      paramCount++;
    }

    if (filters.remoteOnly) {
      query += ' AND remote_allowed = true';
    }

    query += ' ORDER BY posted_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
    } else {
      query += ' LIMIT 50';
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  async getJobPosting(jobId: string): Promise<any> {
    const query = `
      SELECT * FROM job_postings WHERE id = $1
    `;

    const result = await pool.query(query, [jobId]);

    if (result.rows.length === 0) {
      throw new Error('Job posting not found');
    }

    // Increment view count
    await pool.query(
      'UPDATE job_postings SET view_count = view_count + 1 WHERE id = $1',
      [jobId]
    );

    return result.rows[0];
  }

  async getRecommendedJobs(userId: string, limit: number = 10): Promise<any[]> {
    // Get user's skills from competency scores
    const skillsQuery = `
      SELECT ARRAY_AGG(skill_name) as skills
      FROM competency_scores
      WHERE user_id = $1 AND proficiency_score >= 60
    `;

    const skillsResult = await pool.query(skillsQuery, [userId]);
    const userSkills = skillsResult.rows[0]?.skills || [];

    if (userSkills.length === 0) {
      return this.getJobPostings({ limit });
    }

    // Find jobs matching user's skills
    const query = `
      SELECT
        jp.*,
        (
          SELECT COUNT(*)
          FROM unnest(jp.required_skills) AS skill
          WHERE skill = ANY($1)
        ) AS skill_match_count
      FROM job_postings jp
      WHERE jp.is_active = true
        AND (jp.expires_at IS NULL OR jp.expires_at > NOW())
        AND jp.required_skills && $1
      ORDER BY skill_match_count DESC, jp.posted_at DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [userSkills, limit]);
    return result.rows;
  }

  async applyToJob(userId: string, jobId: string, matchedSkills: string[]): Promise<any> {
    // Calculate skill match percentage
    const jobQuery = 'SELECT required_skills FROM job_postings WHERE id = $1';
    const jobResult = await pool.query(jobQuery, [jobId]);

    if (jobResult.rows.length === 0) {
      throw new Error('Job posting not found');
    }

    const requiredSkills = jobResult.rows[0].required_skills || [];
    const matchPercentage = requiredSkills.length > 0
      ? (matchedSkills.length / requiredSkills.length) * 100
      : 0;

    const query = `
      INSERT INTO job_applications (
        user_id, job_posting_id, matched_skills, skill_match_percentage
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [userId, jobId, matchedSkills, matchPercentage]);

    // Increment application count
    await pool.query(
      'UPDATE job_postings SET application_count = application_count + 1 WHERE id = $1',
      [jobId]
    );

    return result.rows[0];
  }

  async getUserApplications(userId: string): Promise<any[]> {
    const query = `
      SELECT
        ja.*,
        jp.title AS job_title,
        jp.company,
        jp.location,
        jp.remote_allowed
      FROM job_applications ja
      JOIN job_postings jp ON ja.job_posting_id = jp.id
      WHERE ja.user_id = $1
      ORDER BY ja.applied_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // ========================================
  // ORGANIZATION ROI
  // ========================================

  async calculateOrganizationROI(organizationId: string, startDate: Date, endDate: Date): Promise<any> {
    const query = 'SELECT calculate_organization_roi($1, $2, $3) as roi_id';
    const result = await pool.query(query, [organizationId, startDate, endDate]);

    const roiId = result.rows[0].roi_id;

    // Fetch the calculated ROI
    return this.getOrganizationROI(roiId);
  }

  async getOrganizationROI(roiId: string): Promise<any> {
    const query = 'SELECT * FROM organization_roi WHERE id = $1';
    const result = await pool.query(query, [roiId]);

    if (result.rows.length === 0) {
      throw new Error('ROI record not found');
    }

    return result.rows[0];
  }

  async getOrganizationROIHistory(organizationId: string): Promise<any[]> {
    const query = `
      SELECT * FROM organization_roi_summary
      WHERE organization_id = $1
      ORDER BY period_start DESC
    `;

    const result = await pool.query(query, [organizationId]);
    return result.rows;
  }

  async updateOrganizationROI(roiId: string, updates: {
    totalTrainingCost?: number;
    avgSalaryIncreasePercentage?: number;
    totalSalaryIncreaseAmount?: number;
    productivityImprovementPercentage?: number;
    estimatedProductivityValue?: number;
    retentionRateBefore?: number;
    retentionRateAfter?: number;
    costOfTurnoverSaved?: number;
    employeeSatisfactionScore?: number;
    managerSatisfactionScore?: number;
    notes?: string;
  }): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${snakeKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    // Calculate total benefits and ROI
    fields.push(`
      total_benefits = COALESCE(total_salary_increase_amount, 0) +
                       COALESCE(estimated_productivity_value, 0) +
                       COALESCE(cost_of_turnover_saved, 0)
    `);

    fields.push(`
      roi_percentage = CASE
        WHEN total_training_cost > 0 THEN
          ((total_benefits - total_training_cost) / total_training_cost) * 100
        ELSE 0
      END
    `);

    fields.push('updated_at = NOW()');
    values.push(roiId);

    const query = `
      UPDATE organization_roi
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('ROI record not found');
    }

    return result.rows[0];
  }

  // ========================================
  // SALARY BENCHMARKS
  // ========================================

  async getSalaryBenchmark(filters: {
    jobTitle?: string;
    jobLevel?: string;
    industry?: string;
    location?: string;
    skills?: string[];
  }): Promise<any> {
    let query = `
      SELECT * FROM salary_benchmarks
      WHERE 1=1
    `;

    const values: any[] = [];
    let paramCount = 1;

    if (filters.jobTitle) {
      query += ` AND job_title ILIKE $${paramCount}`;
      values.push(`%${filters.jobTitle}%`);
      paramCount++;
    }

    if (filters.jobLevel) {
      query += ` AND job_level = $${paramCount}`;
      values.push(filters.jobLevel);
      paramCount++;
    }

    if (filters.industry) {
      query += ` AND industry = $${paramCount}`;
      values.push(filters.industry);
      paramCount++;
    }

    if (filters.location) {
      query += ` AND (city ILIKE $${paramCount} OR region ILIKE $${paramCount})`;
      values.push(`%${filters.location}%`);
      paramCount++;
    }

    if (filters.skills && filters.skills.length > 0) {
      query += ` AND required_skills && $${paramCount}`;
      values.push(filters.skills);
    }

    query += ' ORDER BY last_updated DESC LIMIT 1';

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }
}

export const careerOutcomeService = new CareerOutcomeService();
