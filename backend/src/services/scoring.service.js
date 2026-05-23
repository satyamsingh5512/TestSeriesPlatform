/**
 * Scoring Service — Phase 1
 * Supports MCQ, MULTI_CORRECT, NAT (with range support)
 * Supports negative marking per question
 */

/**
 * Evaluate a single response.
 * @param {Object} question  - Full question row from DB
 * @param {string|null} answer - Student's answer (null = unattempted)
 * @returns {{ is_correct: boolean|null, marks_awarded: number }}
 */
function evaluateResponse(question, answer) {
  // Unattempted — 0 marks, no penalty
  if (answer === null || answer === undefined || answer === '') {
    return { is_correct: null, marks_awarded: 0 };
  }

  // Schema update mapping: 
  // qtype -> type
  // correct_key -> correct_answer
  // marks -> marks_correct
  // negative_marks -> marks_incorrect
  
  const qType = question.qtype || question.type;
  const correct = (question.correct_key || question.correct_answer || '').trim();
  const marks_correct = parseFloat(question.marks || question.marks_correct) || 4;
  const marks_incorrect = parseFloat(question.negative_marks || question.marks_incorrect) || -1;

  switch (qType) {
    case 'MCQ': {
      const is_correct = answer.trim().toUpperCase() === correct.toUpperCase();
      return {
        is_correct,
        marks_awarded: is_correct ? marks_correct : marks_incorrect,
      };
    }

    case 'MULTI_CORRECT': {
      // correct_answer is comma-separated: "A,C" or "A,B,D"
      const correctSet = new Set(correct.toUpperCase().split(',').map(s => s.trim()));
      const answerSet = new Set(answer.toUpperCase().split(',').map(s => s.trim()));
      const is_correct =
        correctSet.size === answerSet.size &&
        [...correctSet].every(v => answerSet.has(v));
      return {
        is_correct,
        marks_awarded: is_correct ? marks_correct : marks_incorrect,
      };
    }

    case 'NAT': {
      // NAT can use correct_key as "1.5" or range "1.5-2.5"
      // or new schema might use nat_min and nat_max
      const studentVal = parseFloat(answer);
      if (isNaN(studentVal)) return { is_correct: false, marks_awarded: 0 };

      // Range check from new schema
      if (question.nat_min !== undefined && question.nat_max !== undefined && question.nat_min !== null) {
         const is_correct = studentVal >= parseFloat(question.nat_min) && studentVal <= parseFloat(question.nat_max);
         return { is_correct, marks_awarded: is_correct ? marks_correct : 0 };
      }

      // Legacy string range check
      if (correct.includes('-')) {
        const [lo, hi] = correct.split('-').map(Number);
        const is_correct = studentVal >= lo && studentVal <= hi;
        return { is_correct, marks_awarded: is_correct ? marks_correct : 0 };
      } else {
        const is_correct = Math.abs(studentVal - parseFloat(correct)) < 1e-9;
        return { is_correct, marks_awarded: is_correct ? marks_correct : 0 };
      }
    }

    default:
      return { is_correct: null, marks_awarded: 0 };
  }
}

/**
 * Score all responses for an attempt.
 * @param {Array} questions   - Array of question rows
 * @param {Object} responseMap - { question_id: answer_string }
 * @returns {{ total_score: number, breakdown: Array }}
 */
function calculateTotal(questions, responseMap) {
  let total_score = 0;
  const breakdown = questions.map(q => {
    const answer = responseMap[q.id] ?? null;
    const { is_correct, marks_awarded } = evaluateResponse(q, answer);
    total_score += marks_awarded;
    return {
      question_id: q.id,
      answer,
      is_correct,
      marks_awarded,
    };
  });

  return { total_score, breakdown };
}

module.exports = { evaluateResponse, calculateTotal };
