import { ContentPanel } from "@/components/admin/content-panel";
import { listTracksForAdmin } from "@/lib/server/content";

export default async function AdminContentPage() {
  const tracks = await listTracksForAdmin();
  return <ContentPanel initialTracks={tracks} />;
}
