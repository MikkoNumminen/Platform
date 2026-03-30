"use client";

import { useState } from "react";
import { Box, Button, Alert, Typography } from "@mui/material";
import SingleSelect from "./SingleSelect";
import MultiSelect from "./MultiSelect";
import TextQuestion from "./TextQuestion";
import SurveyProgress from "./SurveyProgress";
import SurveyThankYou from "./SurveyThankYou";
import { submitCustomSurvey } from "@/lib/survey-actions";
import type { CustomQuestion, CustomAnswers } from "@/lib/custom-survey-config";
import { validateCustomAnswers } from "@/lib/custom-survey-config";

interface CustomSurveyFormProps {
  questions: CustomQuestion[];
  roundId: string;
  roundTitle: string;
  onComplete?: () => void;
}

export default function CustomSurveyForm({
  questions,
  roundId,
  roundTitle,
  onComplete,
}: CustomSurveyFormProps) {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<CustomAnswers>({});

  const totalSteps = questions.length;
  const currentQuestion = questions[step];
  const isLastStep = step === totalSteps - 1;

  const validateCurrentStep = (): boolean => {
    const q = currentQuestion;
    if (!q.required) return true;

    const answer = answers[q.id];
    if (q.type === "text" && (!answer || (typeof answer === "string" && !answer.trim()))) {
      setStepError("This field is required");
      return false;
    }
    if (q.type === "single" && (!answer || answer === "")) {
      setStepError("Please select an option");
      return false;
    }
    if (q.type === "multi" && (!answer || (Array.isArray(answer) && answer.length === 0))) {
      setStepError("Please select at least one option");
      return false;
    }

    setStepError(null);
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    setStep(step + 1);
    setStepError(null);
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setStepError(null);
    }
  };

  const handleSubmit = async () => {
    const error = validateCustomAnswers(questions, answers);
    if (error) {
      setStepError(error);
      return;
    }

    setSubmitting(true);
    setServerError(null);

    const result = await submitCustomSurvey(answers, roundId);

    if (!result?.error) {
      localStorage.setItem(`platform_survey_${roundId}`, "true");
      setSubmitted(true);
      onComplete?.();
    } else {
      setServerError(result.error);
    }

    setSubmitting(false);
  };

  if (submitted) {
    return <SurveyThankYou />;
  }

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.7 }}>
        {roundTitle}
      </Typography>
      <SurveyProgress currentStep={step} totalSteps={totalSteps} />

      <Box sx={{ minHeight: 300, mb: 3 }}>
        {currentQuestion.type === "single" && (
          <SingleSelect
            label={currentQuestion.text}
            options={currentQuestion.options ?? []}
            value={(answers[currentQuestion.id] as string) ?? ""}
            onChange={(v) => setAnswers({ ...answers, [currentQuestion.id]: v })}
            error={stepError ?? undefined}
          />
        )}

        {currentQuestion.type === "multi" && (
          <MultiSelect
            label={currentQuestion.text}
            options={currentQuestion.options ?? []}
            value={(answers[currentQuestion.id] as string[]) ?? []}
            onChange={(v) => setAnswers({ ...answers, [currentQuestion.id]: v })}
            error={stepError ?? undefined}
          />
        )}

        {currentQuestion.type === "text" && (
          <TextQuestion
            label={currentQuestion.text}
            placeholder=""
            value={(answers[currentQuestion.id] as string) ?? ""}
            onChange={(v) => setAnswers({ ...answers, [currentQuestion.id]: v })}
            error={stepError ?? undefined}
            maxLength={500}
            required={currentQuestion.required}
          />
        )}
      </Box>

      {serverError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {serverError}
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Button onClick={handleBack} disabled={step === 0 || submitting}>
          Back
        </Button>
        {isLastStep ? (
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        ) : (
          <Button variant="contained" onClick={handleNext}>
            Next
          </Button>
        )}
      </Box>
    </Box>
  );
}
