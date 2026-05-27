import { useState } from "react";
import { Section, SectionHeading, BlockImage } from "../shared";
import type { BlockComponentProps } from "../types";

/* ---------- ImageGallery ---------- */
export interface ImageGalleryProps {
  title?: string;
  images: Array<{ url: string; alt: string }>;
}
export function ImageGallery({ props }: BlockComponentProps<ImageGalleryProps>) {
  return (
    <Section>
      {props.title ? <SectionHeading title={props.title} /> : null}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {props.images.map((img, i) => (
          <BlockImage key={i} src={img.url} alt={img.alt} aspect="square" />
        ))}
      </div>
    </Section>
  );
}

/* ---------- MasonryGallery ---------- */
export interface MasonryGalleryProps {
  title?: string;
  images: Array<{ url: string; alt: string }>;
}
export function MasonryGallery({ props }: BlockComponentProps<MasonryGalleryProps>) {
  return (
    <Section>
      {props.title ? <SectionHeading title={props.title} /> : null}
      <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
        {props.images.map((img, i) => (
          <img
            key={i}
            src={img.url}
            alt={img.alt}
            loading="lazy"
            className="mb-4 w-full rounded-lg object-cover"
          />
        ))}
      </div>
    </Section>
  );
}

/* ---------- VideoSection ---------- */
export interface VideoSectionProps {
  title: string;
  videoUrl: string;
  posterUrl?: string;
  description?: string;
}
export function VideoSection({ props }: BlockComponentProps<VideoSectionProps>) {
  return (
    <Section>
      <SectionHeading title={props.title} subtitle={props.description} />
      <div className="overflow-hidden rounded-2xl border border-border shadow-lg">
        <video
          src={props.videoUrl}
          poster={props.posterUrl}
          controls
          className="aspect-video w-full"
        />
      </div>
    </Section>
  );
}

/* ---------- BeforeAfter ---------- */
export interface BeforeAfterProps {
  title: string;
  beforeUrl: string;
  afterUrl: string;
}
export function BeforeAfter({ props }: BlockComponentProps<BeforeAfterProps>) {
  const [pos, setPos] = useState(50);
  return (
    <Section>
      <SectionHeading title={props.title} />
      <div className="relative mx-auto aspect-video max-w-3xl overflow-hidden rounded-2xl border border-border">
        <img src={props.afterUrl} alt="After" className="absolute inset-0 h-full w-full object-cover" />
        <img
          src={props.beforeUrl}
          alt="Before"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        />
        <div
          className="absolute top-0 h-full w-1 bg-white shadow-lg"
          style={{ left: `${pos}%` }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          className="absolute inset-x-0 bottom-4 mx-auto w-2/3 cursor-ew-resize"
          aria-label="Before/after slider"
        />
      </div>
    </Section>
  );
}

/* ---------- TikTokReels ---------- */
export interface TikTokReelsProps {
  title: string;
  reels: Array<{ thumbnailUrl: string; videoUrl: string; caption?: string }>;
}
export function TikTokReels({ props }: BlockComponentProps<TikTokReelsProps>) {
  return (
    <Section>
      <SectionHeading title={props.title} />
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4">
        {props.reels.map((r, i) => (
          <a
            key={i}
            href={r.videoUrl}
            className="relative aspect-[9/16] w-48 shrink-0 snap-start overflow-hidden rounded-2xl border border-border"
          >
            <img src={r.thumbnailUrl} alt={r.caption ?? ""} className="h-full w-full object-cover" />
            {r.caption ? (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-xs text-white">
                {r.caption}
              </span>
            ) : null}
          </a>
        ))}
      </div>
    </Section>
  );
}
