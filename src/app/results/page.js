"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, X, BarChart3, RefreshCw, AlertTriangle, ClipboardList } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export default function ResultsPage() {
  const [quizData, setQuizData] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    correct: 0,
    incorrect: 0
  });
  const router = useRouter();

  useEffect(() => {
    // Check for quiz data and user answers in sessionStorage
    const storedQuizData = sessionStorage.getItem("quizData");
    const storedUserAnswers = sessionStorage.getItem("userAnswers");

    if (!storedQuizData || !storedUserAnswers) {
      // Redirect to home if data is missing
      setError("Quiz data is missing. Please start a new quiz.");
      return;
    }

    try {
      const parsedQuizData = JSON.parse(storedQuizData);
      const parsedUserAnswers = JSON.parse(storedUserAnswers);

      // Validate data structure
      if (
        !parsedQuizData.questions ||
        !Array.isArray(parsedQuizData.questions) ||
        !parsedQuizData.questions.length
      ) {
        setError("Invalid quiz data format. Please start a new quiz.");
        return;
      }

      setQuizData(parsedQuizData);
      setUserAnswers(parsedUserAnswers);

      // Calculate score and statistics
      const totalQuestions = parsedQuizData.questions.length;
      const correctAnswers = parsedUserAnswers.filter(
        (answer, index) =>
          answer !== null &&
          index < totalQuestions &&
          answer === parsedQuizData.questions[index].correctAnswer
      );
      
      const correctCount = correctAnswers.length;
      const answeredQuestions = parsedUserAnswers.filter(answer => answer !== null).length;
      const incorrectCount = answeredQuestions - correctCount;

      setStats({
        total: totalQuestions,
        correct: correctCount,
        incorrect: incorrectCount
      });

      setScore((correctCount / totalQuestions) * 100);
    } catch (error) {
      console.error("Error parsing stored data:", error);
      setError(
        "There was an error loading your results. Please start a new quiz."
      );
    }
  }, [router]);

  const handleAnalysis = () => {
    // Navigate to the analysis page
    router.push("/analysis");
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-center">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={handleBackToHome}>Back to Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!quizData || !userAnswers.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-primary"></div>
          <p className="mt-2">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Quiz Results</CardTitle>
          <CardDescription className="text-center">
            You scored {Math.round(score)}% on this quiz
          </CardDescription>
          <div className="mt-4">
            <Progress value={score} className="h-3" />
          </div>
        </CardHeader>
        <CardContent className="flex justify-center gap-4">
          <Button onClick={handleBackToHome} className="flex items-center">
            <RefreshCw className="mr-2 h-4 w-4" />
            New Quiz
          </Button>
          <Button
            onClick={handleAnalysis}
            variant="outline"
            className="flex items-center"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Analyze Performance
          </Button>
        </CardContent>
      </Card>

      {/* New Question Statistics Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <ClipboardList className="mr-2 h-5 w-5" />
            Question Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Total Questions</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 mb-1">Correct Answers</p>
              <p className="text-3xl font-bold text-green-600">{stats.correct}</p>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600 mb-1">Incorrect Answers</p>
              <p className="text-3xl font-bold text-red-600">{stats.incorrect}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Question Review</h2>

        <Accordion type="single" collapsible className="w-full">
          {quizData.questions.map((question, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer === question.correctAnswer;

            return (
              <AccordionItem key={index} value={`question-${index}`}>
                <AccordionTrigger className="hover:bg-gray-50 px-4 py-2 rounded-md">
                  <div className="flex justify-between items-center w-full text-left">
                    <span className="text-md">Question {index + 1}</span>
                    <div className="flex items-center">
                      {isCorrect ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-600 border-green-200"
                        >
                          <Check className="h-3 w-3 mr-1" /> Correct
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-600 border-red-200"
                        >
                          <X className="h-3 w-3 mr-1" /> Incorrect
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 py-2">
                  <div className="space-y-4">
                    <p className="font-medium">{question.question}</p>

                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className={`p-3 rounded-md flex items-center ${
                            optionIndex === question.correctAnswer
                              ? "bg-green-50 border border-green-200"
                              : optionIndex === userAnswer
                                ? "bg-red-50 border border-red-200"
                                : "bg-gray-50"
                          }`}
                        >
                          <span className="mr-2">
                            {String.fromCharCode(65 + optionIndex)}.
                          </span>
                          <span>{option}</span>
                          {optionIndex === question.correctAnswer && (
                            <Check className="h-4 w-4 ml-auto text-green-600" />
                          )}
                          {optionIndex === userAnswer &&
                            optionIndex !== question.correctAnswer && (
                              <X className="h-4 w-4 ml-auto text-red-600" />
                            )}
                        </div>
                      ))}
                    </div>

                    <div className="bg-blue-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">Explanation</h4>
                      <p>{question.explanation}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}