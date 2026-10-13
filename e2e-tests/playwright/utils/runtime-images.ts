import {
  buildImageRef,
  imageRefToString,
  parseCatalogIndexImage,
  run,
  type ImageRef,
} from "./helper";
import { isRecord } from "./kube-client/helpers";

const digestPattern = /^sha256:[a-f0-9]{64}$/u;

async function pinImage(image: ImageRef): Promise<ImageRef> {
  if (image.separator === "@") {
    if (!digestPattern.test(image.tag))
      throw new Error("Runtime image has an invalid SHA-256 digest");
    return image;
  }
  const output = await run(
    "oc",
    ["image", "info", imageRefToString(image), "--filter-by-os=linux/amd64", "-o", "json"],
    { timeout: 60_000 },
  );
  const manifest: unknown = JSON.parse(output);
  if (
    !isRecord(manifest) ||
    typeof manifest.digest !== "string" ||
    !digestPattern.test(manifest.digest)
  ) {
    throw new Error(`Registry did not return a digest for ${imageRefToString(image)}`);
  }
  return buildImageRef(image.registry, image.repository, manifest.digest);
}

/** Resolve once in global setup; replacement workers inherit the exact same images. */
export async function prepareRuntimeImages(): Promise<void> {
  const digest = process.env.IMAGE_DIGEST?.trim();
  if (digest !== undefined && digest !== "" && !digestPattern.test(digest)) {
    throw new Error("IMAGE_DIGEST must be a complete SHA-256 image digest");
  }
  const image = buildImageRef(
    process.env.IMAGE_REGISTRY ?? "quay.io",
    process.env.IMAGE_REPO ?? "rhdh-community/rhdh",
    digest === undefined || digest === "" ? (process.env.TAG_NAME ?? "next") : digest,
  );
  const index = parseCatalogIndexImage(
    process.env.CATALOG_INDEX_IMAGE ??
      `quay.io/rhdh/plugin-catalog-index:${process.env.RELEASE_VERSION ?? "next"}`,
  );
  const pinnedImage = await pinImage(image);
  const pinnedIndex = await pinImage(index);
  process.env.IMAGE_DIGEST = pinnedImage.tag;
  process.env.CATALOG_INDEX_IMAGE = imageRefToString(pinnedIndex);
  console.log(
    `[runtime] Pinned application ${imageRefToString(pinnedImage)} and catalog ${process.env.CATALOG_INDEX_IMAGE}`,
  );
}
