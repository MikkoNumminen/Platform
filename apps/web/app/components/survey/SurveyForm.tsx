"use client";

import { useState, useEffect } from "react";
import { Box, Button, Alert } from "@mui/material";
import SurveyProgress from "./SurveyProgress";
import SingleSelect from "./SingleSelect";
import MultiSelect from "./MultiSelect";
import TextQuestion from "./TextQuestion";
import SurveyThankYou from "./SurveyThankYou";
import { submitSurvey } from "@/lib/survey-actions";
import {
  CONVERSATION_STYLES,
  FEATURE_OPTIONS,
  LOCALSTORAGE_KEY,
  validateSurveyData,
  type SurveyData,
  type ValidationErrors,
} from "@/lib/survey-config";

const TOTAL_STEPS = 5;

export default function SurveyForm() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [data, setData] = useState<SurveyData>({
    conversationStyle: "",
    features: [],
    mustHave: "",
    dealbreaker: "",
    otherFeedback: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const alreadySubmitted = localStorage.getItem(LOCALSTORAGE_KEY);
      if (alreadySubmitted) setSubmitted(true);
    }
  }, []);

  const validateCurrentStep = (): boolean => {
    const newErrors: ValidationErrors = {};

    switch (step) {
      case 0:
        if (!data.conversationStyle) {
          newErrors.conversationStyle = "Please select a conversation style";
        }
        break;
      case 1:
        if (data.features.length === 0) {
          newErrors.features = "Please select at least one feature";
        }
        break;
      case 2:
        if (!data.mustHave.trim()) {
          newErrors.mustHave = "This field is required";
        } else if (data.mustHave.length > 200) {
          newErrors.mustHave = "Maximum 200 characters";
        }
        break;
      case 3:
        if (data.dealbreaker && data.dealbreaker.length > 200) {
          newErrors.dealbreaker = "Maximum 200 characters";
        }
        break;
      case 4:
        if (data.otherFeedback && data.otherFeedback.length > 500) {
          newErrors.otherFeedback = "Maximum 500 characters";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      setErrors({});
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    const { valid, errors: allErrors } = validateSurveyData(data);
    if (!valid) {
      setErrors(allErrors);
      return;
    }

    setSubmitting(true);
    setServerError(null);

    const result = await submitSurvey(data);

    if (result.success) {
      localStorage.setItem(LOCALSTORAGE_KEY, "true");
      setSubmitted(true);
    } else {
      setServerError(result.error || "Something went wrong");
    }

    setSubmitting(false);
  };

  if (submitted) {
    return <SurveyThankYou />;
  }

  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <SurveyProgress currentStep={step} totalSteps={TOTAL_STEPS} />

      <Box sx={{ minHeight: 300, mb: 3 }}>
        {step === 0 && (
          <SingleSelect
            label="What conversation style do you prefer?"
            options={CONVERSATION_STYLES}
            value={data.conversationStyle}
            onChange={(v) => setData({ ...data, conversationStyle: v })}
            error={errors.conversationStyle}
          />
        )}

        {step === 1 && (
          <MultiSelect
            label="Which features would you use? (pick all that apply)"
            options={FEATURE_OPTIONS}
            value={data.features}
            onChange={(v) => setData({ ...data, features: v })}
            error={errors.features}
          />
        )}

        {step === 2 && (
          <TextQuestion
            label="Your #1 must-have feature?"
            placeholder="The one thing that would make you visit daily..."
            value={data.mustHave}
            onChange={(v) => setData({ ...data, mustHave: v })}
            error={errors.mustHave}
            maxLength={200}
            required
          />
        )}

        {step === 3 && (
          <TextQuestion
            label="Your #1 dealbreaker?"
            placeholder="The one thing that would make you NOT use the platform..."
            value={data.dealbreaker}
            onChange={(v) => setData({ ...data, dealbreaker: v })}
            error={errors.dealbreaker}
            maxLength={200}
          />
        )}

        {step === 4 && (
          <TextQuestion
            label="Anything else?"
            placeholder="Feature ideas, pet peeves from other platforms..."
            value={data.otherFeedback}
            onChange={(v) => setData({ ...data, otherFeedback: v })}
            error={errors.otherFeedback}
            maxLength={500}
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
