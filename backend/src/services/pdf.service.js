const puppeteer = require('puppeteer');

async function generateAttemptReport(data) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
  });
  const page = await browser.newPage();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
        .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
        .score-box { display: flex; justify-content: space-around; background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px; }
        .score-item { text-align: center; }
        .score-val { font-size: 24px; font-weight: bold; color: #3b82f6; }
        .topic-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .topic-table th, .topic-table td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
        .topic-table th { background: #f1f5f9; }
        .question { margin-bottom: 20px; padding: 15px; border-left: 4px solid #e2e8f0; }
        .correct { border-left-color: #22c55e; }
        .incorrect { border-left-color: #ef4444; }
        h2 { color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Examination Performance Report</h1>
        <p>Attempt ID: ${data.attempt_id}</p>
      </div>

      <div class="score-box">
        <div class="score-item">
          <div>Total Score</div>
          <div class="score-val">${data.total_score} / ${data.max_score}</div>
        </div>
        <div class="score-item">
          <div>Accuracy</div>
          <div class="score-val">${data.accuracy_percent}%</div>
        </div>
        <div class="score-item">
          <div>Percentile Rank</div>
          <div class="score-val">${data.percentile ? data.percentile.toFixed(2) : 'N/A'}%</div>
        </div>
      </div>

      <h2>Topic Analysis</h2>
      <table class="topic-table">
        <thead>
          <tr>
            <th>Topic</th>
            <th>Accuracy</th>
            <th>Avg Time</th>
            <th>Verdict</th>
          </tr>
        </thead>
        <tbody>
          ${(data.analysis?.topic_report || []).map(t => `
            <tr>
              <td>${t.topic}</td>
              <td>${t.accuracy}%</td>
              <td>${t.avg_time}s</td>
              <td>${t.verdict}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>Question Breakdown</h2>
      ${data.questions.map((q, i) => {
        const text = q.payload?.text || q.text || 'N/A';
        const correctAnswer = q.correct_key || q.correct_answer || 'N/A';
        return `
          <div class="question ${q.is_correct ? 'correct' : 'incorrect'}">
            <strong>Q${i + 1}: ${text}</strong><br/>
            <small>Topic: ${q.topic}</small><br/>
            <p>Your Answer: ${q.student_answer || 'N/A'}</p>
            <p>Correct Answer: ${correctAnswer}</p>
            <p>Time Spent: ${q.time_spent_seconds}s | Marks: ${q.marks_awarded}</p>
          </div>
        `;
      }).join('')}
    </body>
    </html>
  `;

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();
  return pdf;
}

module.exports = { generateAttemptReport };
