import Image, { type StaticImageData } from "next/image";
import Placeholder from "@/components/Placeholder";

type ProjectImageProps = {
  image: StaticImageData | undefined;
  /** Slot name shown in the dashed box when empty, e.g. "System map". */
  label: string;
  hint?: string;
  /** Real alt text for the filled state — `label` is a slot name, not a
   *  description, and is never used as alt text. */
  alt: string;
  sizes: string;
  /**
   * Empty-state sizing only. A Placeholder has no intrinsic size and needs
   * an aspect ratio to occupy the right amount of space; a real image must
   * never receive one — forcing a ratio on a real screenshot is what made
   * object-cover crop it by a different amount at every breakpoint. This
   * class name is structurally unreachable by the <Image> below.
   */
  ratio: string;
  /** Border/rounding applied to the real image's wrapper only — a
   *  Placeholder brings its own. */
  frameClassName?: string;
  preload?: boolean;
};

export default function ProjectImage({
  image,
  label,
  hint,
  alt,
  sizes,
  ratio,
  frameClassName = "",
  preload = false,
}: ProjectImageProps) {
  if (!image) {
    return <Placeholder label={label} hint={hint} className={ratio} />;
  }

  return (
    <div className={`w-full overflow-hidden ${frameClassName}`}>
      {/* No width/height props and no `fill`: StaticImageData already
          carries the file's true dimensions, so the tag ships real
          width/height attributes and h-auto w-full scales the whole
          image down with the viewport instead of cropping it. */}
      <Image
        src={image}
        alt={alt}
        placeholder="blur"
        preload={preload}
        sizes={sizes}
        className="h-auto w-full"
      />
    </div>
  );
}
