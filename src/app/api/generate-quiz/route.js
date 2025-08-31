import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export async function POST(request) {
  try {
    // Get the form data which includes the PDF file
    const formData = await request.formData();
    const pdfFile = formData.get('pdfFile');
    const difficulty = formData.get('difficulty') || 'medium'; // Default to medium if not specified
    
    if (!pdfFile) {
      return NextResponse.json({ error: 'PDF file is required' }, { status: 400 });
    }
    
    // Convert file to ArrayBuffer
    const buffer = await pdfFile.arrayBuffer();
    
    // Define schema for questions
    const quizSchema = z.object({
      questions: z.array(z.object({
        question: z.string(), 
        options: z.array(z.string()), 
        correctAnswer: z.number(),
        explanation: z.string() 
      }))
    });
    

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
    }

    const result = await generateObject({
      model: google('gemini-2.0-flash-001'),
      schema: quizSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an expert JEE-Advanced question maker, known for crafting challenging yet conceptually sound questions that test a learner's understanding, application, and reasoning skills. 
              Given the provided PDF study material, extract key concepts, principles, theories, and examples and design a quiz that does not rely on rote memorization but rather forces the learner to think deeply, apply concepts practically, and analyze scenarios critically.
              Quiz Generation Guidelines:

              Question Coverage:
              Ensure that questions cover all topics in the provided PDF study material.
              Questions should focus majorly on the most important concepts, with weightage decreasing for less critical topics

              Question Types:
              Scenario-Based MCQs: Present real-life or practical situations where learners must apply theoretical knowledge.
              Assertion & Reasoning: Ensure that assertion-reasoning questions demand logical thinking rather than simple recall.
              Concept Replacement/Substitution: Challenge learners by asking what can replace a missing component or concept and justify why.
              What Happens If…: Frame questions around hypothetical situations to test the learner's grasp of dependencies and causation.

              Option Generation:
              Ensure no repeated options across any question.
              Mix true/false, multi-conceptual, and reasoning-based options to eliminate guesswork.
              Make options progressively trickier based on difficulty level(Stated difficulty level: ${difficulty}):
                  Easy: Two distractors (wrong options) should be plausible but incorrect; one should be an obvious trap.
                  Medium: All options should seem correct at first glance, but one should be conceptually flawed to trick surface-level thinkers.
                  Hard: Introduce options that require multi-step reasoning, mixing numbers, units, graphs, and "almost correct but subtly wrong" answers.
              Avoid giving away the answer! The difference between correct and incorrect options should be subtle yet clear to those who truly understand the topic

              Explanations:
              Explanations should be precise, extraordinary, and in simple language that makes complex concepts clear.
              Do not just state the correct answer—explain why other options are incorrect to strengthen understanding.
              Answers should be framed in a way that, even if a student gets a question wrong, they learn something valuable from the explanation.

              Example Output:
              Q1: [Scenario-Based]
              A mechanical engineer is testing a heat engine where the working substance is a monatomic gas. If the gas is replaced with a diatomic gas under the same conditions, how will the efficiency change?

              A) Increase
              B) Decrease
              C) Remain the same
              D) Cannot be determined

              ✅ Correct Answer: B) Decrease
              💡 Explanation: The efficiency of a heat engine depends on the ratio of specific heats (γ = Cp/Cv). For a monatomic gas, γ ≈ 1.67, while for a diatomic gas, γ ≈ 1.4. Since efficiency η = 1 - (1/γ), a lower γ results in reduced efficiency.

              Q2: [Assertion & Reasoning]
              Assertion: In an AC circuit, a capacitor allows current to flow through it.
              Reason: A capacitor stores charge and then releases it periodically in an AC circuit.

              A) Both assertion and reason are correct, and the reason explains the assertion.
              B) Both assertion and reason are correct, but the reason does not explain the assertion.
              C) The assertion is correct, but the reason is incorrect.
              D) Both assertion and reason are incorrect.

              ✅ Correct Answer: A) Both assertion and reason are correct, and the reason explains the assertion.
              💡 Explanation: A capacitor allows AC current to flow because it charges and discharges periodically. In a DC circuit, however, the capacitor blocks steady current after charging.

              Final Notes:
              Questions should mirror JEE-Advanced difficulty level given: ${difficulty} , ensuring a mix of direct conceptual, multi-step reasoning, and applied physics/mathematics.
              Explanations should be insightful and act as mini-revision notes, enhancing conceptual clarity.
              The quiz should adapt in difficulty based on the learner's progress, ensuring effective learning.
              Now, based on this, generate a 50-question quiz covering diverse question types from the given PDF.
              ask questions from the same logic and concept from web browser
              Generate 10 scenario-based multiple-choice questions to test my understanding of the first 20 TRIZ principles. Each question should:
Generate 5 extremely challenging TRIZ-based multiple-choice questions using only the first 20 principles. Each question should:

1. Be based on a **layered, complex real-world scenario**, such as an industrial, medical, or technological situation.
2. Contain **implicit contradictions** that the reader must extract before identifying the relevant principle (e.g., speed vs. safety, weight vs. strength, efficiency vs. flexibility).
3. Ask the reader to determine **which TRIZ principle most precisely resolves the core contradiction** or conflict.
4. Include **6 to 7 answer options**, where:
   - At least **4 of the choices are conceptually similar** (e.g., all time-related or energy-compensating principles)
   - **All options must sound equally reasonable** and require nuanced understanding to distinguish.
5. Phrase choices as **interpretive or action-based statements**, not principle names (e.g., “Preloading the material with opposing stress” instead of “Prior Counteraction”).
6. Avoid obvious clues. Force deep thought. Make **answer choice language subtle and technical**.
Label each question and answer choice clearly. Don't reveal the correct answers—I'll try to solve them myself.

              

              `
            },
            {
              type: 'file',
              data: new Uint8Array(buffer),
              mimeType: 'application/pdf',
            },
          ],
        },
      ],
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    // Validate the returned data structure
    if (!result || !result.object.questions || !Array.isArray(result.object.questions) || result.object.questions.length === 0) {
      console.error("Invalid response structure:", result);
      return NextResponse.json({
        error: 'Failed to generate valid quiz questions from the PDF content'
      }, { status: 500 });
    }

    // Make sure the response follows the expected structure
    return NextResponse.json({
      questions: result.object.questions.map(q => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      })),
      difficulty: difficulty 
    });
  } catch (error) {
    console.error('Error generating quiz:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate quiz' }, { status: 500 });
  }
}