"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

interface Banner {
  id: number | string;
  image: string;
  title?: string;
  link?: string;
}

export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch("/api/banners");
        const data = await res.json();
        setBanners(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  if (loading || banners.length === 0) return null;

  return (
    <div className="w-screen -mx-5 overflow-hidden">
      <Swiper
        modules={[Pagination, Autoplay]}
        pagination={{ clickable: true }}
        autoplay={{ delay: 3500, disableOnInteraction: false }}
        loop
        className="h-48 md:h-60 w-screen"
      >
        {banners.map((b) => {
          const imageSrc = b.image.startsWith("/")
            ? b.image
            : `/${b.image}`;

          return (
            <SwiperSlide key={b.id}>
              <a
                href={b.link || "#"}
                className="relative block h-full"
              >
                {/* IMAGE */}
                <img
                  src={imageSrc}
                  alt={b.title || "banner"}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />

                {/* DARK GRADIENT OVERLAY */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

                {/* TITLE */}
                {b.title && (
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="inline-block rounded-xl bg-black/40 px-3 py-1 text-xs text-white backdrop-blur-md">
                      {b.title}
                    </div>
                  </div>
                )}
              </a>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* 🔥 PRO STYLING */}
      <style jsx global>{`
        .swiper-pagination-bullet {
          background: rgba(255, 255, 255, 0.5);
          opacity: 1;
          width: 6px;
          height: 6px;
        }

        .swiper-pagination-bullet-active {
          background: #f97316;
          width: 18px;
          border-radius: 999px;
        }
      `}</style>

      {/* ✨ EDGE GLOW EFFECT */}
      <div className="pointer-events-none absolute inset-0 ring-1 ring-orange-400/20" />
    </div>
  );
}
