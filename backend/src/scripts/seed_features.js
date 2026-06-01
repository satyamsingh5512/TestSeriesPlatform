require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_features (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        feature_key VARCHAR(50) NOT NULL,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'coming_soon',
        metadata JSONB DEFAULT '{}'::jsonb,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tenant_id, feature_key)
      );
    `);
    console.log("✅ Created tenant_features table");
    
    const tenantRes = await pool.query('SELECT id FROM tenants LIMIT 1');
    if (tenantRes.rows.length > 0) {
      const tenantId = tenantRes.rows[0].id;
      const features = [
        { key: 'live_classes', title: 'Live Classes', desc: 'Join interactive daily live sessions with top educators.' },
        { key: 'free_tests', title: 'FREE Test Series', desc: 'Attempt full-length mock tests completely free of cost.' },
        { key: 'pro_pass', title: 'ExamForge Pass PRO', desc: 'Unlock every test, video, and previous paper with one subscription.' },
        { key: 'prev_papers', title: 'Previous Papers', desc: 'Practice exactly what appeared in past years.' },
        { key: 'rank_predictor', title: 'Rank Predictor', desc: 'Know where you stand against thousands of students.' }
      ];

      for (const f of features) {
        await pool.query(`
          INSERT INTO tenant_features (tenant_id, feature_key, title, description, status) 
          VALUES ($1, $2, $3, $4, 'coming_soon')
          ON CONFLICT (tenant_id, feature_key) DO NOTHING
        `, [tenantId, f.key, f.title, f.desc]);
      }
      console.log("✅ Seeded default features");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

run();
