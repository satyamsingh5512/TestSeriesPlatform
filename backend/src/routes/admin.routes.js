const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

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

module.exports = router;
