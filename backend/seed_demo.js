require('dotenv').config();
const pool = require('./src/db/pool');
const bcrypt = require('bcryptjs');

async function seed() {
  const hash = await bcrypt.hash('password', 10);
  
  try {
    // 1. Seed Tenant
    const tenantRes = await pool.query(`
      INSERT INTO tenants (name, subdomain)
      VALUES ('Demo Institute', 'demo')
      ON CONFLICT (subdomain) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `);
    const tenantId = tenantRes.rows[0].id;
    console.log('✅ Tenant seeded:', tenantId);

    // 2. Seed Admin
    await pool.query(`
      INSERT INTO users (name, email, password_hash, role, tenant_id) 
      VALUES ('Demo Admin', 'admin@demo.com', $1, 'admin', $2)
      ON CONFLICT (tenant_id, email) DO NOTHING
    `, [hash, tenantId]);

    // 3. Seed Student
    await pool.query(`
      INSERT INTO users (name, email, password_hash, role, tenant_id) 
      VALUES ('Demo Student', 'student@demo.com', $1, 'student', $2)
      ON CONFLICT (tenant_id, email) DO NOTHING
    `, [hash, tenantId]);

    // 4. Seed a Sample Exam
    const examRes = await pool.query(`
      INSERT INTO exams (tenant_id, title, description, duration_minutes, total_marks, status)
      VALUES ($1, 'General Proficiency Test', 'A sample exam covering basic concepts.', 60, 100, 'published')
      RETURNING id
    `, [tenantId]);
    const examId = examRes.rows[0].id;

    // 5. Seed a Section
    const sectionRes = await pool.query(`
      INSERT INTO sections (exam_id, title, order_index)
      VALUES ($1, 'Mathematics', 1)
      RETURNING id
    `, [examId]);
    const sectionId = sectionRes.rows[0].id;

    // 6. Seed a Question
    await pool.query(`
      INSERT INTO questions (tenant_id, exam_id, section_id, qtype, payload, correct_key, marks, topic)
      VALUES ($1, $2, $3, 'MCQ', $4, 'B', 4.00, 'Arithmetic')
    `, [
      tenantId, examId, sectionId, 
      JSON.stringify({
        text: 'What is 15% of 200?',
        options: { A: '25', B: '30', C: '35', D: '40' }
      })
    ]);

    console.log('✅ Demo accounts and sample exam data seeded.');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  } finally {
    await pool.end();
  }
}

seed();
