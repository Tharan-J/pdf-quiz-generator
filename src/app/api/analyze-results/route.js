import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Define Zod schema for the analysis data
const analysisSchema = z.object({
  performanceAnalysis: z.object({
    overallUnderstanding: z.string(),
    knowledgeGaps: z.array(z.string()),
    areasForImprovement: z.array(z.string()),
    suggestedStudyTopics: z.array(z.string()),
    suggestedResources: z.array(z.string()),
    nextFocusConcepts: z.array(z.string()),
  }),
});

export async function POST(request) {
  try {
    const data = await request.json();
    const { userAnswers, quizData, difficulty } = data;

    if (!userAnswers || !quizData) {
      return NextResponse.json({ error: 'User answers and quiz data are required' }, { status: 400 });
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
    }

    // Calculate score
    let correctCount = 0;
    const questionsWithAnswers = quizData.questions.map((q, index) => {
      const isCorrect = userAnswers[index] === q.correctAnswer;
      if (isCorrect) correctCount++;
      return {
        question: q.question,
        userAnswer: userAnswers[index],
        correctAnswer: q.correctAnswer,
        isCorrect
      };
    });

    const score = (correctCount / quizData.questions.length) * 100;

    // Generate analysis
    const analysisResult = await generateObject({
      model: google('gemini-2.0-flash-001'),
      schema: analysisSchema,
      messages: [
        {
          role: 'user',
          content: `I took a quiz with ${quizData.questions.length} questions on the difficulty level "${difficulty}". I got ${correctCount} questions correct (${score.toFixed(1)}%).

          Here are my answers:
         ${JSON.stringify(questionsWithAnswers, null, 2)}

            You are a Ph.D.-holding professor and researcher with deep expertise in conceptual learning, knowledge analysis, and student development. 
            Your role is to analyze a student's quiz performance thoroughly and provide a precise, highly targeted learning roadmap.
            The student has completed a JEE-Advanced style quiz where each question was carefully designed to test depth of understanding, practical application, and critical reasoning skills.

             Your Analysis Should Include:
            1.Understanding Level & Current Mastery

            Based on the student's responses, evaluate their understanding level (Beginner, Intermediate, Advanced, or Expert).
            Provide insights into their thought process—do they rely on memorization, partial understanding, or deep conceptual clarity?
            Identify their learning pattern—are they struggling with application, logical traps, or multi-step reasoning?
            Guide them on how to level up.
            Example:
            "Your responses indicate that you have a strong grasp of fundamental definitions but struggle with multi-step logical reasoning, especially when concepts are combined. You are currently at an Intermediate Level, but by refining your approach to conceptual application, you can move to Advanced Level within X weeks."

            2.Specific Concepts You Lack Understanding Of
            Identify the exact topics where the student lost marks or made incorrect assumptions.
            Pinpoint why they struggled—was it due to misunderstanding of a formula, incorrect application, or misinterpretation of question wording?
            Break down the misconceptions in simple terms.
            Example:
            "You struggled with Electrostatics - Capacitance in Parallel & Series. Your mistake was assuming that capacitors in series add up like resistors, but in reality, the reciprocal rule applies. This led to errors in 2 questions."

            3.Areas Where Improvement is Needed
            Highlight the patterns of mistakes:
            Calculation-based errors?
            Logical errors in assertion-reasoning?
            Struggles with conceptual traps?
            Suggest focused improvement strategies.
            Example:
            "Your biggest challenge was in eliminating tricky answer choices. In multi-step numerical questions, you often fell for trap answers designed for common calculation errors. Practicing back-substitution and estimation techniques will help you improve this."

            4.Suggested Study Topics & Resources (With Time Estimation)
            Recommend specific subtopics the student should study—not just broad subjects.
            Include practical explanations of what they need to focus on.
            Provide a realistic time estimate for mastering each topic.
            Example:
            Topic: Work-Energy Theorem vs. Newton's Laws
            What to Study: Understanding when to use energy methods instead of force-based equations.
            Suggested Study Time: 4-6 hours for conceptual understanding + 2-3 hours for problem-solving.
            Resource: HC Verma - Concepts of Physics (Ch.6) & PYQs from JEE-Advanced.

            5. What Concepts to Focus on Next
            Based on current weaknesses, suggest which topics to tackle next for maximum improvement in minimal time.
            Prioritize high-impact concepts—topics that frequently appear in competitive exams.
             Example:
            "Since you are struggling with rotational motion, your next focus should be Moment of Inertia and Torque Applications. Start by understanding the fundamental definitions, then move to problem-solving."

            Reminding Notes:
            Your report should be precise, deeply analytical, and structured to save the student's time.
            Prioritize concepts they are weak in, not what they already know.
            Your suggestions should be practical and time-bound, ensuring efficient learning.
            Now, generate a detailed performance report and study plan based on the quiz results.
  

          The response must be a JSON object that strictly adheres to the following format:

          \`\`\`json
          {
            "performanceAnalysis": {
              "overallUnderstanding": "...",
              "knowledgeGaps": ["...", "..."],
              "areasForImprovement": ["...", "..."],
              "suggestedStudyTopics": ["...", "..."],
              "suggestedResources": ["...", "..."],
              "nextFocusConcepts": ["...", "..."]
            }
          }
          \`\`\`

          Do not include any additional text or explanations. Return ONLY valid json. All keys must be in camelCase.`,
        }
      ],
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    // Log raw analysis result for debugging
    console.log("Raw Analysis Result:", analysisResult);

    try {
      // Validate analysis result against the schema
      analysisSchema.parse(analysisResult.object);

      return NextResponse.json({
        score,
        correctCount,
        totalQuestions: quizData.questions.length,
        analysis: analysisResult.object,
      });
    } catch (parseError) {
      console.error("Failed to parse analysis result:", parseError);
      console.log("Raw analysis result:", analysisResult);

      return NextResponse.json({
        score,
        correctCount,
        totalQuestions: quizData.questions.length,
        error: "Could not parse analysis results",
        rawAnalysis: analysisResult,
      });
    }
  } catch (error) {
    console.error('Error analyzing results:', error);
    return NextResponse.json({ error: error.message || 'Failed to analyze results' }, { status: 500 });
  }
}
