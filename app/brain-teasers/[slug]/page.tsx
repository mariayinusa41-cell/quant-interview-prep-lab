import type { Metadata } from "next";
import DarkMode from "../DarkMode";
import StoryTeaser from "../story/StoryTeaser";
import { TEASER_BANK, getTeaser } from "../story/teaserBank";

export function generateStaticParams() {
  return TEASER_BANK.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const teaser = getTeaser(slug);
  return {
    title: teaser ? `${teaser.title} - Brain Teasers` : "Brain Teasers",
    description: teaser?.description ?? "Playable brain teasers, worked out step by step.",
  };
}

export default async function TeaserPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const teaser = getTeaser(slug);

  if (!teaser) {
    return (
      <>
        <DarkMode />
        <main className="pirate-stage-main answer-page">
          <a href="/brain-teasers" className="pirate-back-link">
            &larr; Brain Teasers
          </a>
          <div className="pirate-stage-content">
            <p className="pirate-story-line">That teaser doesn&apos;t exist yet.</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/brain-teasers" className="pirate-back-link">
          &larr; Brain Teasers
        </a>
        <StoryTeaser teaser={teaser} />
      </main>
    </>
  );
}
