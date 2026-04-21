import { notFound } from "next/navigation";

import { TrackDetailPanel } from "@/components/admin/track-detail-panel";
import { getTrackWithLessons } from "@/lib/server/content";
import { NotFoundError } from "@/lib/server/permissions";

type PageProps = { params: Promise<{ trackId: string }> };

export default async function AdminTrackDetailPage({ params }: PageProps) {
  const { trackId } = await params;

  try {
    const track = await getTrackWithLessons(trackId);
    return <TrackDetailPanel initialTrack={track} />;
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}
