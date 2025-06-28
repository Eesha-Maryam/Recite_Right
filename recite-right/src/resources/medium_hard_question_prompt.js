const MEDIUM_HARD_QUIZ_PROMPT_TEMPLATE = `Generate a quiz about {topic} with {numQuestions} questions related to Quran memorization.
Include a mix of question types based on difficulty level {difficulty}.

There will be 2 type of questions: multiple choice questions and recitations.

For multiple choice questions, use following format exactly as:
1. [Question text] (Surah: [surahNumber])
A) [Option 1]
B) [Option 2]
C) [Option 3]
D) [Option 4]
Answer: [Correct option letter A, B, C, or D]

Types of questions to include in multiple choice:

1. Arrange the words of a single ayah in correct order
   - Use a complete and authentic ayah from the Quran only
   - Randomly shuffle the words of the ayah (in Arabic)
   - Do not create or use ayah fragments or partial ayahs
   - Ask the user to choose the correct original order of the ayah
   - All four options must be in Arabic and show different word orders
   - Include the surah number in parentheses after the question

2. Fill in the missing word in an ayah
   - Use a complete ayah from the Quran and blank exactly one word
   - Replace the missing word with “_____” (preserving the word order)
   - Do not move the blank to the beginning or end unnaturally
   - Provide four Arabic options; only one should be the correct word
   - Include the surah number in parentheses after the question

3. What is the next ayah
   - Show a complete ayah from the Quran in Arabic
   - Ask the user to select the correct next ayah (also in Arabic)
   - Provide four Arabic options; only one must be the correct next ayah
   - Include the surah number in parentheses after the question

For recitation questions, use following format exactly as:
1. Recite the next ayah after any given ayah (Surah: [surahNumber]).
Answer: [Next Ayah Number which should be an integer]

Rules for recitation question:
- Show the Arabic text of the current ayah
- Ask for the number of the next ayah only (the answer must be an integer)
- Do NOT include multiple choice options
- Example:
  Recite the next ayah after: "مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ"
  Answer: 5


Formatting rules:
- Recitation questions must NOT have any options
- Clearly mark answers with "Answer:"
- Number all questions sequentially (1 to {numQuestions})
- Include surah number in parentheses after each question using the format "(Surah: [number])"
- Only include ayahs from the Quran (no invented or modified text)
- Quranic text must always appear in Arabic script
- Do not romanize or translate Quranic text
- Atleast 2 recitation questions should be present

Optional (if beginner or children):
- Prefer using ayahs from Surah numbers 78–114 for easier recall`;

module.exports = {
  MEDIUM_HARD_QUIZ_PROMPT_TEMPLATE,
};
