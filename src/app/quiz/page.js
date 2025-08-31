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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Timer, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function QuizPage() {
  
  const [quizData, setQuizData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0); // Will be set based on difficulty
  const [error, setError] = useState(null);
  const [submitQuiz, setSubmitQuiz] = useState(false);
  const router = useRouter();

  // Function to determine time based on difficulty
  const getTimeByDifficulty = (difficulty) => {
    switch(difficulty.toLowerCase()) {
      case 'easy':
        return 10 * 60; // 10 minutes in seconds
      case 'hard':
        return 5 * 60; // 5 minutes in seconds
      case 'medium':
      default:
        return 7 * 60; // 7 minutes in seconds
    }
  };

  useEffect(() => {
    // Check for quiz data in sessionStorage
    const storedQuizData = sessionStorage.getItem("quizData");

    if (!storedQuizData) {
      // Redirect to home if no quiz data
      router.push("/");
      return;
    }

    try {
      const parsedData = JSON.parse(storedQuizData);
      console.log("Parsed Quiz Data:", parsedData);

      // Validate the structure of the quiz data
      if (
        !parsedData ||
        !parsedData.questions ||
        !Array.isArray(parsedData.questions)
      ) {
        console.error("Invalid quiz data structure:", parsedData);
        setError(
          "The quiz data has an unexpected format. Please try generating a new quiz."
        );
        return;
      }

      setQuizData(parsedData);

      // Set timer based on difficulty
      const difficulty = parsedData.difficulty || 'medium'; // Default to medium if not specified
      const timeForDifficulty = getTimeByDifficulty(difficulty);
      setTimeRemaining(timeForDifficulty);

      // Initialize user answers array with nulls
      setUserAnswers(new Array(parsedData.questions.length).fill(null));
    } catch (error) {
      console.error("Error parsing quiz data:", error);
      setError("There was an error loading the quiz. Please try again.");
    }
  }, [router]);

  // Timer effect
  useEffect(() => {
    if (!quizData || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer); // Clear timer when time runs out
          setSubmitQuiz(true); // Set submitQuiz to true when time runs out
          return 0; // Set timeRemaining to zero
        }
        return prev - 1; // Decrease timeRemaining by one second
      });
    }, 1000);

    return () => clearInterval(timer); // Cleanup interval on component unmount
  }, [quizData, timeRemaining]);

  // Handle submission logic
  useEffect(() => {
    if (submitQuiz) {
      handleSubmit(); // Call handleSubmit when submitQuiz is true
    }
  }, [submitQuiz]);

  const handleAnswerSelect = (value) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = parseInt(value);
    setUserAnswers(newAnswers);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleNext = () => {
    if (quizData && currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleSubmit = () => {
    // Ensure all questions have been answered with a default value of null
    const completedAnswers = userAnswers.map(
      (answer) => (answer !== null ? answer : null) // Keep unanswered as null
    );

    // Store user answers in sessionStorage
    sessionStorage.setItem("userAnswers", JSON.stringify(completedAnswers));

    console.log("Submitted Answers:", completedAnswers); // Debugging log

    // Navigate to results page after state is updated
    router.push("/results");
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
            <CardTitle className="text-center">Error Loading Quiz</CardTitle>
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

  if (!quizData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-primary"></div>
          <p className="mt-2">Loading quiz...</p>
        </div>
      </div>
    );
  }

  const question = quizData.questions[currentQuestion];

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" + secs : secs}`;
  };

  // Add a function to get difficulty display text (with color)
  const getDifficultyDisplay = () => {
    const difficulty = quizData.difficulty?.toLowerCase() || 'medium';
    const colorMap = {
      'easy': 'text-green-500',
      'medium': 'text-yellow-500',
      'hard': 'text-red-500'
    };
    
    return (
      <span className={colorMap[difficulty]}>
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </span>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>
                Question {currentQuestion + 1} of {quizData.questions.length}
              </CardTitle>
              <CardDescription className="mt-1">
                Difficulty: {getDifficultyDisplay()}
              </CardDescription>
            </div>
            <div className="flex items-center text-orange-500">
              <Timer className="h-4 w-4 mr-2" />
              <span>{formatTime(timeRemaining)}</span>
            </div>
          </div>
          <Progress
            value={((currentQuestion + 1) / quizData.questions.length) * 100}
            className="h-2 mt-4"
          />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-lg font-medium">{question.question}</div>

            <RadioGroup
              value={userAnswers[currentQuestion]?.toString()}
              onValueChange={handleAnswerSelect}
            >
              {question.options.map((option, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-3 rounded-md hover:bg-gray-100"
                  onClick={() => handleAnswerSelect(index)}
                >
                  <RadioGroupItem
                    value={index.toString()}
                    id={`option-${index}`}
                  />
                  <Label
                    htmlFor={`option-${index}`}
                    className="flex-grow cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentQuestion < quizData.questions.length - 1 ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={() => setSubmitQuiz(true)}>
              Submit Quiz
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}