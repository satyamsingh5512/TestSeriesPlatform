const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authMiddleware);

/**
 * GET /api/exams
 * List published exams scoped to the current user's tenant
 */
router.get('/', async (req, res, next) => {
  try {
    const { tenant_id } = req.user;
    const result = await pool.query(
      `SELECT id, title, description, goal, duration_minutes, total_marks, exam_type, created_at
       FROM exams 
       WHERE tenant_id = $1 AND status = 'published' 
       ORDER BY created_at DESC`,
      [tenant_id]
    );
    res.json({ status: 'success', exams: result.rows });
  } catch (err) { 
    next(err); 
  }
});

/**
 * GET /api/exams/recommended
 * Suggest published exams matching the current user's profile
 * (age, study_level, stream, course) against exam goal/title/description.
 * Must be declared before GET /:id to avoid being captured as an :id param.
 */
router.get('/recommended', async (req, res, next) => {
  try {
    const { tenant_id, id: user_id } = req.user;

    const userRes = await pool.query(
      'SELECT age, study_level, stream, course, target_goal FROM users WHERE id = $1',
      [user_id]
    );
    const profile = userRes.rows[0] || {};

    const examsRes = await pool.query(
      `SELECT id, title, description, goal, duration_minutes, total_marks, exam_type, created_at
       FROM exams
       WHERE tenant_id = $1 AND status = 'published'
       ORDER BY created_at DESC`,
      [tenant_id]
    );

    // Study-level -> typical age band, used only when the exam text doesn't
    // give us a clearer signal (age ranges are indicative, not strict cutoffs).
    const AGE_BANDS = {
      school: [14, 18],
      undergrad: [17, 25],
      postgrad: [21, 30],
      working: [21, 60],
      other: [0, 120],
    };

    const keywordsFor = (level) => ({
      school: ['jee', 'neet', 'ncert', 'board', 'olympiad', 'school'],
      undergrad: ['gate', 'placement', 'campus', 'internship', 'aptitude'],
      postgrad: ['gate', 'net', 'phd', 'research', 'ugc'],
      working: ['bank', 'ssc', 'upsc', 'psu', 'po', 'clerk', 'civil services', 'railway'],
      other: [],
    }[level] || []);

    const norm = (s) => (s || '').toLowerCase();

    const scoreExam = (exam) => {
      let score = 0;
      const text = `${norm(exam.goal)} ${norm(exam.title)} ${norm(exam.description)}`;

      // Direct stream/course keyword match against goal/title/description
      if (profile.stream && text.includes(norm(profile.stream))) score += 3;
      if (profile.course && text.includes(norm(profile.course))) score += 3;

      // Strongest signal: the student's own stated target exam/goal
      if (profile.target_goal && text.includes(norm(profile.target_goal))) score += 5;

      // Study-level keyword heuristics
      const kws = keywordsFor(profile.study_level);
      for (const kw of kws) {
        if (text.includes(kw)) score += 2;
      }

      // Age-band plausibility (soft signal, not a filter)
      if (profile.age) {
        const band = AGE_BANDS[profile.study_level] || AGE_BANDS.other;
        if (profile.age >= band[0] && profile.age <= band[1]) score += 1;
      }

      return score;
    };

    const ranked = examsRes.rows
      .map((exam) => ({ ...exam, match_score: scoreExam(exam) }))
      .sort((a, b) => b.match_score - a.match_score);

    // If the profile is incomplete or nothing scored, fall back to showing
    // all published exams (most recent first) rather than an empty list.
    const hasProfile = profile.study_level || profile.stream || profile.course || profile.age || profile.target_goal;
    const recommended = hasProfile ? ranked.filter((e) => e.match_score > 0) : ranked;

    res.json({
      status: 'success',
      profile_used: {
        age: profile.age || null,
        study_level: profile.study_level || null,
        stream: profile.stream || null,
        course: profile.course || null,
        target_goal: profile.target_goal || null,
      },
      exams: (recommended.length ? recommended : ranked).slice(0, 20),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/exams/:id
 * Get exam metadata + sections
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { tenant_id } = req.user;
    const { id } = req.params;

    const exam = await pool.query(
      'SELECT * FROM exams WHERE id = $1 AND tenant_id = $2 AND status = \'published\'', 
      [id, tenant_id]
    );
    
    if (!exam.rows.length) {
      const err = new Error('Exam not found');
      err.status = 404;
      throw err;
    }

    const sections = await pool.query(
      'SELECT id, title, duration_minutes, order_index FROM sections WHERE exam_id = $1 ORDER BY order_index',
      [id]
    );

    res.json({ 
      status: 'success',
      exam: exam.rows[0], 
      sections: sections.rows 
    });
  } catch (err) { 
    next(err); 
  }
});

/**
 * POST /api/exams/:id/start
 * Create a new attempt or resume existing one
 */
router.post('/:id/start', async (req, res, next) => {
  try {
    const { tenant_id, id: user_id } = req.user;
    const { id: exam_id } = req.params;

    // --- DPDP Act 2023 Consent Check ---
    const userRes = await pool.query('SELECT dob, consent_verified FROM users WHERE id = $1', [user_id]);
    const user = userRes.rows[0];
    
    let requiresConsent = false;
    if (!user.dob) {
      requiresConsent = true; // Must provide DOB and verify
    } else {
      const ageDate = new Date(Date.now() - new Date(user.dob).getTime());
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (age < 18 && !user.consent_verified) requiresConsent = true;
      if (age >= 18 && !user.consent_verified) requiresConsent = true; // If cron revoked it on 18th birthday
    }

    if (requiresConsent) {
      return res.status(403).json({ 
        error: 'CONSENT_REQUIRED', 
        message: 'DPDP Act Compliance: Parental or adult consent is required before accessing exams.'
      });
    }
    // --- End Consent Check ---

    const exam = await pool.query(
      'SELECT * FROM exams WHERE id = $1 AND tenant_id = $2 AND status = \'published\'', 
      [exam_id, tenant_id]
    );

    if (!exam.rows.length) {
      const err = new Error('Exam not found or unavailable');
      err.status = 404;
      throw err;
    }

    // Check for existing active attempts
    const active = await pool.query(
      `SELECT id FROM attempts 
       WHERE exam_id = $1 AND user_id = $2 AND status = 'in_progress' AND tenant_id = $3`,
      [exam_id, user_id, tenant_id]
    );

    if (active.rows.length) {
      return res.json({ 
        status: 'success',
        attempt_id: active.rows[0].id, 
        resumed: true 
      });
    }

    // Create new attempt
    const result = await pool.query(
      `INSERT INTO attempts (exam_id, user_id, tenant_id, status)
       VALUES ($1, $2, $3, 'in_progress') 
       RETURNING id, started_at`,
      [exam_id, user_id, tenant_id]
    );

    res.status(201).json({ 
      status: 'success',
      attempt_id: result.rows[0].id, 
      started_at: result.rows[0].started_at 
    });
  } catch (err) { 
    next(err); 
  }
});

module.exports = router;
