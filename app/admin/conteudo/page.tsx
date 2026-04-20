import { listTracksForAdmin } from "@/lib/server/content";
import { ContentPanel } from "@/components/admin/content-panel";

export default async function AdminContentPage() {
  const tracks = await listTracksForAdmin();
  return <ContentPanel initialTracks={tracks} />;
}
