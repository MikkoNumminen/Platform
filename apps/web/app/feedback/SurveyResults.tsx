import { Box } from "@mui/material";
import type { SurveyResultsData } from "@/lib/survey-queries";
import ResultsBarChart from "../components/survey/ResultsBarChart";
import TextResponseList from "../components/survey/TextResponseList";

interface SurveyResultsProps {
  results: SurveyResultsData;
}

export default function SurveyResults({ results }: SurveyResultsProps) {
  return (
    <Box sx={{ mt: 1 }}>
      {results.customResults?.map((item) =>
        item.type === "text" && item.textResponses && item.textResponses.length > 0 ? (
          <TextResponseList
            key={item.questionId}
            title={item.questionText}
            responses={item.textResponses}
          />
        ) : item.counts && item.counts.length > 0 ? (
          <ResultsBarChart key={item.questionId} title={item.questionText} items={item.counts} />
        ) : null,
      )}

      {!results.customResults && (
        <>
          {results.conversationStyleCounts.length > 0 && (
            <ResultsBarChart title="Conversation Style" items={results.conversationStyleCounts} />
          )}
          {results.featureCounts.length > 0 && (
            <ResultsBarChart title="Feature Votes" items={results.featureCounts} />
          )}
          {results.mustHaveResponses.length > 0 && (
            <TextResponseList title="Must-Have Features" responses={results.mustHaveResponses} />
          )}
          {results.dealbreakerResponses.length > 0 && (
            <TextResponseList title="Dealbreakers" responses={results.dealbreakerResponses} />
          )}
          {results.otherFeedbackResponses.length > 0 && (
            <TextResponseList title="Other Feedback" responses={results.otherFeedbackResponses} />
          )}
        </>
      )}
    </Box>
  );
}
