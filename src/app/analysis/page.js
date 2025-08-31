"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AnalysisPage = () => {
  const [quizData, setQuizData] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Retrieve quiz data and user answers from sessionStorage
    const storedQuizData = sessionStorage.getItem("quizData");
    const storedUserAnswers = sessionStorage.getItem("userAnswers");

    if (!storedQuizData || !storedUserAnswers) {
      setError("Missing quiz data. Please start a new quiz.");
      return;
    }

    try {
      const parsedQuizData = JSON.parse(storedQuizData);
      const parsedUserAnswers = JSON.parse(storedUserAnswers);

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

      const correctAnswers = parsedUserAnswers.filter(
        (answer, index) =>
          answer !== null &&
          index < parsedQuizData.questions.length &&
          answer === parsedQuizData.questions[index].correctAnswer
      );

      setScore(
        (correctAnswers.length / parsedQuizData.questions.length) * 100
      );

      // Fetch analysis data immediately after quiz data is available
      fetchAnalysisData(parsedQuizData, parsedUserAnswers);
    } catch (err) {
      console.error("Error parsing stored data:", err);
      setError(
        "There was an error loading the analysis. Please start a new quiz."
      );
    }
  }, [router]);

  const fetchAnalysisData = async (quizData, userAnswers) => {
    setLoading(true);
    try {
      const difficulty = sessionStorage.getItem("difficulty") || "medium";
      const response = await fetch("/api/analyze-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userAnswers,
          quizData,
          difficulty,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error Response Data:", errorData); // Log error response
        throw new Error(errorData.error || "Failed to analyze results");
      }

      const data = await response.json();

      // Log received data for debugging
      console.log("Received Analysis Data:", data);

      // Check if analysis data is valid
      if (!data.analysis || !data.analysis.performanceAnalysis) {
        throw new Error("Analysis data is missing or malformed.");
      }

      setAnalysisData(data);
    } catch (err) {
      console.error("Error fetching analysis data:", err);

      // Provide a more detailed error message
      if (err.message.includes("Failed to analyze results")) {
        setError(
          "Failed to analyze results. Please check your internet connection and try again."
        );
      } else {
        setError(err.message); // Use the error message from the catch block
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToResults = () => {
    router.back(); // Go back to the results page
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
            <Button onClick={handleBackToResults}>Back to Results</Button>
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
          <p className="mt-2">Loading analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Performance Analysis
          </CardTitle>
          <CardDescription className="text-center">
            Based on your quiz results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-primary"></div>
              <p className="ml-2">Analyzing performance...</p>
            </div>
          ) : analysisData && analysisData.analysis ? (
            <>
              <div className="text-center">
                <Progress value={score} className="h-4 w-56 mx-auto" />
                <p className="mt-2">
                  You scored {Math.round(score)}% on this quiz.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Understanding Level</h3>
                <p>
                  {analysisData.analysis.performanceAnalysis.overallUnderstanding}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Concepts Lacking</h3>
                <ul>
                  {analysisData.analysis.performanceAnalysis.knowledgeGaps.map(
                    (gap, index) => (
                      <li key={index}>{gap}</li>
                    )
                  )}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Areas to Improve</h3>
                <ul>
                  {analysisData.analysis.performanceAnalysis.areasForImprovement.map(
                    (area, index) => (
                      <li key={index}>{area}</li>
                    )
                  )}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Suggested Topics</h3>
                <ul>
                  {analysisData.analysis.performanceAnalysis.suggestedStudyTopics.map(
                    (topic, index) => (
                      <li key={index}>{topic}</li>
                    )
                  )}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Suggested Resources</h3>
                <ul>
                  {analysisData.analysis.performanceAnalysis.suggestedResources.map(
                    (resource, index) => (
                      <li key={index}>{resource}</li>
                    )
                  )}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Next Focus Concepts</h3>
                <ul>
                  {analysisData.analysis.performanceAnalysis.nextFocusConcepts.map(
                    (concept, index) => (
                      <li key={index}>{concept}</li>
                    )
                  )}
                </ul>
              </div>
            </>
          ) : (
            <Alert variant="destructive">
              {/* Updated alert for better clarity */}
              <AlertDescription>
                Analysis data could not be properly loaded. Please try again
                later.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        {/* Back to Results Button */}
        <CardFooter className="flex justify-center">
          <Button onClick={handleBackToResults}>Back to Results</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AnalysisPage;
