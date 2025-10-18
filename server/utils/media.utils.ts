import cloudinary from "cloudinary";

export async function upsertCourseThumbnail(
  incoming: string | { public_id?: string; url?: string } | undefined,
  existing?: { public_id?: string; url?: string }
) {
  if (!incoming) return existing;

  if (typeof incoming === "string") {
    if (existing?.url && incoming.startsWith("http") && incoming === existing.url) {
      return existing;
    }
    if (existing?.public_id) {
      try {
        await cloudinary.v2.uploader.destroy(existing.public_id);
      } catch {}
    }
    const myCloud = await cloudinary.v2.uploader.upload(incoming, {
      folder: "courses",
      width: 750,
      height: 422,
      crop: "fill",
    });
    return { public_id: myCloud.public_id, url: myCloud.secure_url };
  }

  if (typeof incoming === "object" && incoming.url) {
    return existing;
  }

  return existing;
}
