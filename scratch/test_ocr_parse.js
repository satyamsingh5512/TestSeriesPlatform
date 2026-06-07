const text = `
1. What is the capital of France?
(A) Paris  (B) London
C) Berlin
D. Madrid
Ans: A

Question 2: Which planet is red?
a) Mars b) Jupiter c) Venus d) Saturn
Correct: a
`;

const parts = text.split(/(?:^|\n)\s*(?:Q(?:uestion)?\s*\d+[\.\)\:]?|\d+[\.\)\:])\s+/i).filter(p => p.trim());

parts.forEach(part => {
  console.log("--- PART ---");
  let qText = part;
  const options = { A: '', B: '', C: '', D: '' };
  let correct_key = '';

  const ansMatch = qText.match(/(?:Ans(?:wer)?|Correct)(?:\s*is|\s*option)?\s*[:\-]?\s*([a-d])/i);
  if (ansMatch) {
    correct_key = ansMatch[1].toUpperCase();
    qText = qText.substring(0, ansMatch.index).trim();
  }

  const optPattern = /(?:^|\s|\n)[\(]?([A-D])[\)\.]\s+((?:(?!\s[\(]?[A-D][\)\.]\s).)*)/gi;
  
  let match;
  let firstOptIndex = -1;
  while ((match = optPattern.exec(qText)) !== null) {
    if (firstOptIndex === -1) firstOptIndex = match.index;
    const optLetter = match[1].toUpperCase();
    options[optLetter] = match[2].trim();
  }

  if (firstOptIndex !== -1) {
    qText = qText.substring(0, firstOptIndex).trim();
  }

  console.log("Question:", qText);
  console.log("Options:", options);
  console.log("Correct:", correct_key);
});
