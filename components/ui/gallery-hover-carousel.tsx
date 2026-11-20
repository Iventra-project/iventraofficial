"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";
import Image from "next/image";
import Link from "next/link";

export interface GalleryHoverCarouselItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  image: string;
  category?: string;
  badge?: string;
}

export default function GalleryHoverCarousel({
  heading = "Template Koleksi Event",
  subheading,
  demoUrl = "#",
  layout = "vertical-scroll",
  items = [
    {
      id: "item-academic",
      title: "Academic & Tech Summit",
      summary:
        "Desain modern bernuansa tech indigo untuk konferensi ilmiah, seminar nasional, dan expo teknologi.",
      url: "#",
      image:
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
      category: "Seminar & Konferensi",
      badge: "Paling Populer",
    },
    {
      id: "item-competition",
      title: "National Campus Competition",
      summary:
        "Format dinamis terfokus pada seleksi proposal, pengumpulan berkas, timeline bertingkat, dan penjurian online.",
      url: "#",
      image:
        "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80",
      category: "Kompetisi Mahasiswa",
      badge: "Lomba & Hackathon",
    },
    {
      id: "item-creative",
      title: "Creative & Art Campus Fest",
      summary:
        "Visual dinamis, energik, dan penuh warna untuk festival musik kampus, pameran karya seni, dan pentas teater.",
      url: "#",
      image:
        "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&auto=format&fit=crop&q=80",
      category: "Festival & Seni",
      badge: "Dies Natalis",
    },
    {
      id: "item-webinar",
      title: "Webinar & UI/UX Workshop",
      summary:
        "Tata letak ringkas dengan alur pendaftaran kilat, integrasi materi download, dan live link streaming.",
      url: "#",
      image:
        "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80",
      category: "Workshop",
      badge: "Hands-on",
    },
    {
      id: "item-blank",
      title: "Blank Canvas (Kosongan)",
      summary:
        "Mulai formulir dari kanvas kosong tanpa blok bawaan. Fleksibel untuk survei, RSVP, atau registrasi kustom.",
      url: "#",
      image:
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
      category: "Formulir Bebas",
      badge: "Mulai Dari Nol",
    },
  ],
  onSelectItem,
  className,
}: {
  heading?: string;
  subheading?: string;
  demoUrl?: string;
  layout?: "vertical-scroll" | "carousel";
  items?: GalleryHoverCarouselItem[];
  onSelectItem?: (item: GalleryHoverCarouselItem) => void;
  className?: string;
}) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Carousel scroll tracking (used only if layout === 'carousel')
  useEffect(() => {
    if (!carouselApi || layout !== "carousel") return;
    const update = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    };
    update();
    carouselApi.on("select", update);
    return () => {
      carouselApi.off("select", update);
    };
  }, [carouselApi, layout]);

  return (
    <section className={`py-2 bg-background ${className || ""}`}>
      <div className="container mx-auto px-1 sm:px-2">
        <div className="mb-6 flex flex-col justify-between md:mb-7 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-snug tracking-tight">
              {heading}{" "}
              <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-normal block mt-1">
                {subheading || "Pilih struktur template siap pakai yang telah dioptimasi untuk publikasi dan registrasi event."}
              </span>
            </h3>
          </div>

          {/* Arrow navigation buttons rendered only in horizontal carousel layout */}
          {layout === "carousel" && (
            <div className="flex gap-2 mt-4 md:mt-0 shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={() => carouselApi?.scrollPrev()}
                disabled={!canScrollPrev}
                className="h-9 w-9 rounded-full border-gray-200 hover:bg-gray-100 dark:border-gray-800 cursor-pointer disabled:opacity-40"
                aria-label="Previous template"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => carouselApi?.scrollNext()}
                disabled={!canScrollNext}
                className="h-9 w-9 rounded-full border-gray-200 hover:bg-gray-100 dark:border-gray-800 cursor-pointer disabled:opacity-40"
                aria-label="Next template"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* LAYOUT 1: VERTICAL SCROLL (Effortless mouse wheel & touchpad scrolling) */}
        {layout === "vertical-scroll" ? (
          <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (onSelectItem) {
                      onSelectItem(item);
                    }
                  }}
                  className="cursor-pointer"
                >
                  <Link
                    href={item.url}
                    onClick={(e) => {
                      if (onSelectItem) {
                        e.preventDefault();
                        onSelectItem(item);
                      }
                    }}
                    className="group block relative w-full h-[320px] sm:h-[340px]"
                  >
                    <Card className="overflow-hidden rounded-2xl h-full w-full border border-gray-200/80 shadow-xs hover:shadow-lg transition-all duration-300">
                      {/* Image Container */}
                      <div className="relative h-full w-full transition-all duration-500 group-hover:h-1/2 overflow-hidden bg-slate-900">
                        <Image
                          width={400}
                          height={300}
                          src={item.image}
                          alt={item.title}
                          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Badges */}
                        {item.category && (
                          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                            <span className="text-[10px] font-mono font-bold uppercase bg-white/95 backdrop-blur-xs text-gray-900 px-2 py-0.5 rounded shadow-2xs">
                              {item.category}
                            </span>
                            {item.badge && (
                              <span className="text-[10px] font-mono font-bold uppercase bg-[#1f2de6] text-white px-2 py-0.5 rounded shadow-2xs">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                        {/* Fade overlay at bottom */}
                        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/75 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>

                      {/* Text Section that reveals on hover */}
                      <div className="absolute bottom-0 left-0 w-full px-4 py-3 transition-all duration-500 group-hover:h-1/2 group-hover:flex flex-col justify-between bg-white/95 backdrop-blur-md opacity-0 group-hover:opacity-100 border-t border-gray-100">
                        <div>
                          <h3 className="text-base font-bold text-gray-950 leading-tight">
                            {item.title}
                          </h3>
                          <p className="text-gray-600 text-xs line-clamp-2 mt-1 leading-relaxed">
                            {item.summary}
                          </p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold text-[#1f2de6] uppercase tracking-wider">
                            Gunakan Template
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border border-gray-200 hover:-rotate-45 transition-transform duration-300 rounded-full flex items-center justify-center text-[#1f2de6] hover:bg-[#edf2ff]"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* LAYOUT 2: HORIZONTAL CAROUSEL (If explicitly requested) */
          <div className="w-full max-w-full">
            <Carousel
              setApi={setCarouselApi}
              opts={{ breakpoints: { "(max-width: 768px)": { dragFree: true } } }}
              className="relative w-full max-w-full"
            >
              <CarouselContent className="hide-scrollbar w-full max-w-full md:ml-2 md:-mr-2">
                {items.map((item) => (
                  <CarouselItem key={item.id} className="pr-4 md:max-w-[340px]">
                    <div
                      onClick={() => {
                        if (onSelectItem) {
                          onSelectItem(item);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <Link
                        href={item.url}
                        onClick={(e) => {
                          if (onSelectItem) {
                            e.preventDefault();
                            onSelectItem(item);
                          }
                        }}
                        className="group block relative w-full h-[320px] md:h-[350px]"
                      >
                        <Card className="overflow-hidden rounded-2xl h-full w-full border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow duration-300">
                          {/* Image */}
                          <div className="relative h-full w-full transition-all duration-500 group-hover:h-1/2 overflow-hidden bg-slate-900">
                            <Image
                              width={400}
                              height={300}
                              src={item.image}
                              alt={item.title}
                              className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                            />
                            {/* Badges */}
                            {item.category && (
                              <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                                <span className="text-[10px] font-mono font-bold uppercase bg-white/90 backdrop-blur-xs text-gray-900 px-2 py-0.5 rounded shadow-2xs">
                                  {item.category}
                                </span>
                                {item.badge && (
                                  <span className="text-[10px] font-mono font-bold uppercase bg-[#1f2de6] text-white px-2 py-0.5 rounded shadow-2xs">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                            )}
                            {/* Fade overlay at bottom */}
                            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          </div>

                          {/* Text Section */}
                          <div className="absolute bottom-0 left-0 w-full px-4 py-3 transition-all duration-500 group-hover:h-1/2 group-hover:flex flex-col justify-center bg-white/95 backdrop-blur-md opacity-0 group-hover:opacity-100 border-t border-gray-100">
                            <h3 className="text-base font-bold text-gray-950 md:text-lg leading-tight">
                              {item.title}
                            </h3>
                            <p className="text-gray-600 text-xs md:text-sm line-clamp-2 mt-1 leading-relaxed">
                              {item.summary}
                            </p>
                            <div className="mt-2.5 flex items-center justify-between">
                              <span className="text-[11px] font-mono font-bold text-[#1f2de6] uppercase tracking-wider">
                                Gunakan Desain
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 border border-gray-200 hover:-rotate-45 transition-transform duration-300 rounded-full flex items-center justify-center text-[#1f2de6] hover:bg-[#edf2ff]"
                              >
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        )}
      </div>
    </section>
  );
}
