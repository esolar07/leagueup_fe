import type { ReactNode } from "react";
import { getImageProps } from "next/image";
import tallPhoto from "../../../public/photos/hero-flag-football-tall.jpg";
import widePhoto from "../../../public/photos/hero-flag-football-wide.jpg";

const ALT = "Adults playing flag football in a park at sunset";

/** Portrait photo on phones, wide photo from `md` (art direction: two crops, one <img>). */
function heroImage() {
  const common = { alt: ALT, sizes: "100vw" };
  const {
    props: { srcSet: wideSrcSet },
  } = getImageProps({ ...common, src: widePhoto });
  const {
    props: { srcSet: tallSrcSet, ...image },
  } = getImageProps({
    ...common,
    src: tallPhoto,
    loading: "eager",
    fetchPriority: "high",
  });
  return { wideSrcSet, tallSrcSet, image };
}

/**
 * Full-bleed photo hero. Phones: the portrait photo, with content rising into its navy fade.
 * From `md`: the wide photo pinned right at full height; its baked-in left fade meets the navy
 * background on wide screens (the left edge is feathered so there's no seam). Content sits in the same 1200px page column as the rest of the page.
 */
export function PhotoHero({ children }: { children: ReactNode }) {
  const { wideSrcSet, tallSrcSet, image } = heroImage();
  return (
    <section className="relative overflow-hidden border-b border-border bg-brand-navy">
      <picture>
        <source media="(min-width: 768px)" srcSet={wideSrcSet} />
        <img
          {...image}
          alt={ALT}
          srcSet={tallSrcSet}
          className="block h-auto w-full md:absolute md:inset-y-0 md:right-0 md:h-full md:w-auto md:max-w-none md:[mask-image:linear-gradient(to_right,transparent,black_25%)]"
        />
      </picture>
      <div aria-hidden className="absolute inset-0 hidden bg-gradient-to-r from-brand-navy via-brand-navy/70 to-transparent md:block lg:via-brand-navy/40" />
      <div className="relative mx-auto -mt-[30vw] w-full px-4 pb-12 sm:px-6 lg:w-[90%] lg:px-0 md:mt-0 md:flex md:min-h-[600px] md:flex-col md:items-start md:justify-center md:py-20 lg:min-h-[680px]">
        {children}
      </div>
    </section>
  );
}
