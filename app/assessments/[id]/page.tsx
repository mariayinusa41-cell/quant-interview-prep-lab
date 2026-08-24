import type { Metadata } from "next";
import ExamMode from "./ExamMode";
import AssessmentPageClient from "./AssessmentPageClient";

export const metadata: Metadata = {
  title: "Assessment",
  description: "Timed assessment session.",
};

export default async function AssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <ExamMode />
      <main className="exam-root">
        <AssessmentPageClient id={id} />
      </main>
    </>
  );
}
