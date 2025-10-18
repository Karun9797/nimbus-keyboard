"use client";

import { FC, Suspense, useEffect, useState } from "react";
import { Content } from "@prismicio/client";
import { PrismicRichText, SliceComponentProps } from "@prismicio/react";
import { Bounded } from "../../components/Bounded";
import { Canvas } from "@react-three/fiber";
import { Scene } from "./Scene";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { Loader } from "@/components/Loader";
import { useProgress } from "@react-three/drei";
import { div } from "three/tsl";
import clsx from "clsx";

gsap.registerPlugin(ScrollTrigger, SplitText);

function LoaderWrapper() {
  const { active } = useProgress();
  const [isloading, setIsLoading] = useState(true);
  useEffect(() => {
    if (active) {
      setIsLoading(true);
    } else {
      const timer = setTimeout(() => setIsLoading(false), 100);
      return () => clearTimeout(timer);
    }
  }, [active]);

  return (
    <div
      className={clsx(
        "motion-safe:transition-opacity motion-safe:duration-700",
        isloading ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <Loader />
    </div>
  );
}
/**
 * Props for `Hero`.
 */
export type HeroProps = SliceComponentProps<Content.HeroSlice>;

/**
 * Component for "Hero" Slices.
 */
const Hero: FC<HeroProps> = ({ slice }) => {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const split = SplitText.create(".hero-heading", {
        type: "chars, line",
        mask: "lines",
        linesClass: "line++",
      });

      const tl = gsap.timeline({ delay: 3 });

      tl.from(split.chars, {
        opacity: 0,
        y: -120,
        ease: "back",
        duration: 0.4,
        stagger: 0.07,
      }).to(".hero-body", {
        opacity: 1,
        duration: 0.6,
        ease: "power3.out",
      });

      gsap.fromTo(
        ".hero-scene",
        {
          background:
            "linear-gradient(to bottom, #000000, #0f172a, #062f4a, #7fa0b9)",
        },
        {
          background:
            "linear-gradient(to bottom, #062f4a, #125683, #649fc7, #cbdce9)",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "50% bottom",
            scrub: 1,
          },
        },
      );
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(".hero-heading, .hero-body", { opacity: 1 });
    });
  });
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="hero blue-gradient-bg relative h-[300vh] text-white text-shadow-black/30 text-shadow-lg"
    >
      <div className="hero-scene pointer-events-none sticky top-0 h-dvh w-full">
        <Canvas shadows="soft">
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </div>
      <LoaderWrapper />
      <div className="hero-content absolute inset-0 h-dvh">
        <Bounded
          fullWidth
          className="absolute inset-x-0 top-18 md:top-24 md:left-[8vw]"
        >
          <PrismicRichText
            field={slice.primary.heading}
            components={{
              heading1: ({ children }) => (
                <h1 className="hero-heading text-6xl leading-[0.8] font-black uppercase italic sm:text-7xl lg:text-8xl">
                  {children}
                </h1>
              ),
            }}
          />
        </Bounded>
        <Bounded
          fullWidth
          className="hero-body md:left-autop absolute bottom-0 opacity-0 md:right-[8vw] md:left-auto"
          innerClassName="flex flex-col"
        >
          <PrismicRichText
            field={slice.primary.body}
            components={{
              heading2: ({ children }) => (
                <h2 className="mb-1 text-4xl font-black wrap-normal break-all uppercase italic lg:mb-2 lg:text-6xl">
                  {children}
                </h2>
              ),
              paragraph: ({ children }) => (
                <p className="break-all">{children}</p>
              ),
            }}
          />
          <button className="group flex w-fit cursor-pointer items-center gap-1 rounded bg-sky-500 px-3 py-1.5 text-2xl font-black uppercase italic transition disabled:grayscale">
            {slice.primary.buy_button_text}
            <span className="transition group-hover:translate-x-1">{">"}</span>
          </button>
        </Bounded>
      </div>
    </section>
  );
};

export default Hero;
