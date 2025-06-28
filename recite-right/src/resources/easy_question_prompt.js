const EASY_QUIZ_PROMPT_TEMPLATE = `Generate a quiz about {topic} with {numQuestions} multiple choice questions only related to memorization.
Each question text and options must be written in English, except for any Quranic words, phrases, or verses, which should be in Arabic script (no romanization).
Do not translate numbers or generic English text into Arabic. Only Quranic text should appear in Arabic script.
Each question should be formatted exactly as follows:

1. [Question text] (Surah: [surahNumber])
A) [Option 1]
B) [Option 2]
C) [Option 3]
D) [Option 4]
Answer: [Correct option letter A, B, C, or D]

Formatting rules:
 - Each question must have exactly 4 options
 - The correct answer must be one of A, B, C, or D
 - Questions must be numbered sequentially (1 to {numQuestions})
 - Include surah number in parentheses after each question using format "(Surah: [number])"
 - Surah numbers must be between 1 and 114

Types of questions to include (and only these):

1. Arrange the words of a single ayah in correct order
   - Use a complete and authentic ayah from the Quran only
   - Randomly shuffle the words of the ayah (in Arabic)
   - Ask the user to choose the correct original order
   - Do not mix words from different ayahs or invent fragments

2. Fill in the missing word in an ayah
   - Use a real ayah from the Quran and remove exactly one word
   - Replace the missing word with “_____” while preserving correct word order
   - Include 4 Arabic options where only one fits the blank
   - Do not change the structure or split the sentence unnaturally

3. What is the next ayah
   - Show a complete ayah in Arabic
   - Ask the user to select the correct next ayah (also in Arabic)
   - Include 4 Arabic options and label as usual (A-D)
`;

module.exports = {
  EASY_QUIZ_PROMPT_TEMPLATE,
};
