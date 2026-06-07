const express = require('express');
const pool = require('../db/pool');
const redis = require('../db/redis');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');
const bcrypt = require('bcryptjs');

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// Apply auth + admin check to all routes here
router.use(authMiddleware);
router.use(roleMiddleware('admin', 'superadmin'));

/**
 * GET /api/admin/exams
 */
router.get('/exams', async (req, res, next) => {
  try {
    const { tenant_id } = req.user;
    const result = await pool.query(
      `SELECT e.*, 
       (SELECT COUNT(*) FROM attempts a WHERE a.exam_id = e.id) as attempt_count,
       (SELECT COUNT(*) FROM questions q WHERE q.exam_id = e.id) as question_count
       FROM exams e 
       WHERE e.tenant_id = $1 
       ORDER BY e.created_at DESC`,
      [tenant_id]
    );
    res.json({ status: 'success', exams: result.rows });
  } catch (err) { next(err); }
});

/**
 * POST /api/admin/exams
 */
router.post('/exams', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { tenant_id } = req.user;
    const { title, description, duration_minutes, total_marks, exam_type, sections } = req.body;

    await client.query('BEGIN');

    const examRes = await client.query(
      `INSERT INTO exams (tenant_id, title, description, duration_minutes, total_marks, exam_type, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'published') RETURNING id`,
      [tenant_id, title, description, duration_minutes || 180, total_marks || 0, exam_type || 'fixed']
    );
    const examId = examRes.rows[0].id;

    if (sections && Array.isArray(sections)) {
      for (const [sIdx, s] of sections.entries()) {
        const secRes = await client.query(
          `INSERT INTO sections (exam_id, title, order_index, duration_minutes)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [examId, s.title, sIdx + 1, s.duration_minutes || null]
        );
        const sectionId = secRes.rows[0].id;

        if (s.questions && Array.isArray(s.questions)) {
          for (const [qIdx, q] of s.questions.entries()) {
            await client.query(
              `INSERT INTO questions (tenant_id, exam_id, section_id, qtype, payload, correct_key, marks, negative_marks, explanation, sequence, difficulty_tier)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [
                tenant_id, examId, sectionId, 
                q.qtype || q.type || 'MCQ', 
                JSON.stringify({ text: q.text, options: q.options || null }),
                q.correct_key || q.correct_answer,
                q.marks || q.marks_correct || 4,
                q.negative_marks || q.marks_incorrect || -1,
                q.explanation || null,
                qIdx + 1,
                q.difficulty_tier || 'medium'
              ]
            );
          }
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ status: 'success', exam_id: examId });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

/**
 * PATCH /api/admin/exams/:id
 * Update exam status
 */
router.patch('/exams/:id', async (req, res, next) => {
  try {
    const { tenant_id } = req.user;
    const { id } = req.params;
    const { status } = req.body;

    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE exams SET status = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3
       RETURNING id, status`,
      [status, id, tenant_id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Exam not found' });

    res.json({ status: 'success', exam: result.rows[0] });
  } catch (err) { next(err); }
});

/**
 * GET /api/admin/exams/:examId/attempts
 * List all attempts for an exam
 */
router.get('/exams/:examId/attempts', async (req, res, next) => {
  try {
    const { tenant_id } = req.user;
    const { examId } = req.params;

    const result = await pool.query(
      `SELECT a.*, u.name as student_name, u.email,
       (SELECT COUNT(*) FROM violations v WHERE v.attempt_id = a.id) as violation_count
       FROM attempts a
       JOIN users u ON u.id = a.user_id
       WHERE a.exam_id = $1 AND a.tenant_id = $2
       ORDER BY a.started_at DESC`,
      [examId, tenant_id]
    );

    res.json({ status: 'success', attempts: result.rows });
  } catch (err) { next(err); }
});

/**
 * GET /api/admin/attempts/:id/violations
 */
router.get('/attempts/:attemptId/violations', async (req, res, next) => {
  try {
    const { tenant_id } = req.user;
    const { attemptId } = req.params;

    const attemptRes = await pool.query(
      `SELECT a.*, u.name as student_name, u.email, e.title as exam_title
       FROM attempts a
       JOIN users u ON u.id = a.user_id
       JOIN exams e ON e.id = a.exam_id
       WHERE a.id = $1 AND a.tenant_id = $2`,
      [attemptId, tenant_id]
    );

    if (attemptRes.rows.length === 0) return res.status(404).json({ error: 'Attempt not found' });

    const violations = await pool.query(
      `SELECT * FROM violations WHERE attempt_id = $1 ORDER BY occurred_at DESC`,
      [attemptId]
    );

    res.json({
      status: 'success',
      attempt: attemptRes.rows[0],
      violations: violations.rows,
      auto_flagged: violations.rows.length > 5
    });
  } catch (err) { next(err); }
});

/**
 * PATCH /api/admin/violations/:id
 * Update violation status (cleared, suspicious, confirmed)
 */
router.patch('/violations/:violationId', async (req, res, next) => {
  try {
    const { tenant_id } = req.user;
    const { violationId } = req.params;
    const { status } = req.body; // cleared, suspicious, confirmed

    const result = await pool.query(
      `UPDATE violations v
       SET status = $1
       FROM attempts a
       WHERE v.id = $2 AND v.attempt_id = a.id AND a.tenant_id = $3
       RETURNING v.id, v.status`,
      [status, violationId, tenant_id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Violation not found' });

    res.json({ status: 'success', violation: result.rows[0] });
  } catch (err) { next(err); }
});

/**
 * PATCH /api/admin/questions/:id
 * Update question and invalidate cache
 */
router.patch('/questions/:id', async (req, res, next) => {
  try {
    const { tenant_id } = req.user;
    const { id } = req.params;
    const { payload, correct_key, marks, negative_marks, explanation, difficulty_tier } = req.body;

    const result = await pool.query(
      `UPDATE questions
       SET payload = COALESCE($1, payload),
           correct_key = COALESCE($2, correct_key),
           marks = COALESCE($3, marks),
           negative_marks = COALESCE($4, negative_marks),
           explanation = COALESCE($5, explanation),
           difficulty_tier = COALESCE($6, difficulty_tier)
       WHERE id = $7 AND tenant_id = $8
       RETURNING id, exam_id`,
      [
        payload ? JSON.stringify(payload) : null,
        correct_key, marks, negative_marks, explanation, difficulty_tier,
        id, tenant_id
      ]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Question not found' });

    const examId = result.rows[0].exam_id;
    await redis.del(`exam:${examId}:questions`);

    res.json({ status: 'success', question_id: result.rows[0].id });
  } catch (err) { next(err); }
});

/**
 * GET /api/admin/features
 * Admin list of all features
 */
router.get('/features', async (req, res, next) => {
  try {
    const { tenant_id } = req.user;
    const result = await pool.query(
      `SELECT feature_key, title, description, status, metadata, updated_at 
       FROM tenant_features 
       WHERE tenant_id = $1
       ORDER BY title ASC`,
      [tenant_id]
    );
    res.json({ status: 'success', features: result.rows });
  } catch (err) { next(err); }
});

/**
 * PATCH /api/admin/features/:key
 * Admin update feature status/content
 */
router.patch('/features/:key', async (req, res, next) => {
  try {
    const { tenant_id } = req.user;
    const { key } = req.params;
    const { title, description, status, metadata } = req.body;

    const result = await pool.query(
      `UPDATE tenant_features
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           metadata = COALESCE($4, metadata),
           updated_at = NOW()
       WHERE feature_key = $5 AND tenant_id = $6
       RETURNING *`,
      [title, description, status, metadata, key, tenant_id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Feature not found' });

    res.json({ status: 'success', feature: result.rows[0] });
  } catch (err) { next(err); }
});

/**
 * POST /api/admin/ocr/extract
 * Upload image for OCR extraction (Lightweight via OCR.space API)
 */
router.post('/ocr/extract', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    // We use OCR.space free API
    const ocrApiKey = process.env.OCR_API_KEY || 'helloworld'; // 'helloworld' is the default free key
    
    const response = await axios.post('https://api.ocr.space/parse/image', form, {
      headers: {
        ...form.getHeaders(),
        'apikey': ocrApiKey
      }
    });

    if (response.data && response.data.ParsedResults && response.data.ParsedResults.length > 0) {
      // Join text from all pages if it's a multi-page document/PDF
      const text = response.data.ParsedResults.map(r => r.ParsedText).join('\n\n');
      res.json({ status: 'success', data: { success: true, text: text.trim(), filename: req.file.originalname } });
    } else {       res.status(400).json({ error: 'Failed to extract text', details: response.data });
    }
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json({ error: err.response.data });
    }
    next(err);
  }
});

/**
 * GET /api/admin/stats
 * Admin dashboard statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const { tenant_id } = req.user;
    const statsRes = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM users WHERE tenant_id = $1) as total_users,
        (SELECT COUNT(*) FROM exams WHERE tenant_id = $1) as total_exams,
        (SELECT COUNT(*) FROM attempts WHERE tenant_id = $1 AND status = 'in_progress') as active_attempts,
        (SELECT AVG(total_score) FROM attempts WHERE tenant_id = $1 AND status = 'submitted') as avg_score
      `,
      [tenant_id]
    );
    res.json({ status: 'success', stats: statsRes.rows[0] });
  } catch (err) { next(err); }
});

/**
 * GET /api/admin/users
 * List users
 */
router.get('/users', async (req, res, next) => {
  try {
    const { tenant_id } = req.user;
    const result = await pool.query(
      `SELECT id, name, email, role, dob, consent_verified, created_at
       FROM users WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenant_id]
    );
    res.json({ status: 'success', users: result.rows });
  } catch (err) { next(err); }
});

/**
 * POST /api/admin/users
 * Create user
 */
router.post('/users', async (req, res, next) => {
  try {
    const { tenant_id } = req.user;
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, tenant_id, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role`,
      [name, email, hashedPassword, tenant_id, role || 'student']
    );
    res.json({ status: 'success', user: result.rows[0] });
  } catch (err) { next(err); }
});

/**
 * PUT /api/admin/users/:id
 * Update user
 */
router.put('/users/:id', async (req, res, next) => {
  try {
    const { tenant_id } = req.user;
    const { name, email, role } = req.body;
    const result = await pool.query(
      `UPDATE users SET name = $1, email = $2, role = $3, updated_at = NOW()
       WHERE id = $4 AND tenant_id = $5 RETURNING id, name, email, role`,
      [name, email, role, req.params.id, tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ status: 'success', user: result.rows[0] });
  } catch (err) { next(err); }
});

/**
 * DELETE /api/admin/users/:id
 * Delete user
 */
router.delete('/users/:id', async (req, res, next) => {
  try {
    const { tenant_id } = req.user;
    const result = await pool.query(
      `DELETE FROM users WHERE id = $1 AND tenant_id = $2 RETURNING id`,
      [req.params.id, tenant_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ status: 'success', deleted_id: result.rows[0].id });
  } catch (err) { next(err); }
});

module.exports = router;
