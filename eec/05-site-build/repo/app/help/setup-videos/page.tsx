import type { Metadata } from 'next';
import Link from 'next/link';
import HelpNav from '@/components/HelpNav';
import { VIDEO_TUTORIALS, formatDuration, type VideoTutorial } from '@/lib/customer-service';
import { getSkuById } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Setup videos & tutorials',
  description: 'Setup, troubleshooting, and maintenance videos for every Roborock model.'
};

const TOPIC_LABELS: Record<VideoTutorial['topic'], string> = {
  setup: 'Setup',
  troubleshooting: 'Troubleshooting',
  maintenance: 'Maintenance',
  feature_walkthrough: 'Feature walkthrough'
};

export default function SetupVideosPage() {
  const byTopic: Record<string, VideoTutorial[]> = {};
  for (const v of VIDEO_TUTORIALS) {
    (byTopic[v.topic] ||= []).push(v);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-display text-3xl font-bold mb-3">Videos &amp; tutorials</h1>
      <p className="text-brand-neutral-1 mb-2 leading-relaxed">
        Short videos for setup, the seven things that cause stuck-ups, and monthly maintenance. Captioned and transcribed.
      </p>
      <HelpNav active="/help/setup-videos" />

      {(['setup', 'troubleshooting', 'maintenance', 'feature_walkthrough'] as const).map((topic) => {
        const videos = byTopic[topic];
        if (!videos?.length) return null;
        return (
          <section key={topic} className="mb-10">
            <h2 className="font-display text-xl font-bold mb-4">{TOPIC_LABELS[topic]}</h2>
            <div className="grid md:grid-cols-2 gap-5">
              {videos.map((v) => {
                const skus = (v.relatedSkuIds || []).map(getSkuById).filter(Boolean);
                return (
                  <article key={v.id} className="border border-brand-neutral-3 rounded-lg overflow-hidden bg-white">
                    <div className="aspect-video bg-brand-primary relative">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`}
                        title={v.title}
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full border-0"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-2 text-sm leading-snug">{v.title}</h3>
                      <p className="text-xs text-brand-neutral-1 mb-2">{formatDuration(v.durationSeconds)}</p>
                      {v.transcriptSummary && (
                        <p className="text-xs text-brand-neutral-1 leading-relaxed line-clamp-3">
                          {v.transcriptSummary}
                        </p>
                      )}
                      {skus.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {skus.map((s) => (
                            <Link
                              key={s!.id}
                              href={`/products/${s!.slug}`}
                              className="text-xs px-2 py-1 bg-brand-secondary hover:bg-brand-neutral-2 rounded"
                            >
                              {s!.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
