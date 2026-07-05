"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui";

interface AdData {
  id: string;
  imageUrl: string;
  linkUrl: string;
  altText: string | null;
  width: number;
  height: number;
  type: string;
  advertiser: string;
}

interface AdBannerProps {
  type?: string;
  page?: string;
  className?: string;
}

export function AdBanner({ type = "banner", page = "*", className = "" }: AdBannerProps) {
  const [ad, setAd] = useState<AdData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/ads?type=${type}&page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        setAd(data.ad || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [type, page]);

  const handleClick = () => {
    if (!ad) return;
    // Registrar click
    fetch("/api/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adId: ad.id }),
    });
    // Abrir enlace
    if (ad.linkUrl) window.open(ad.linkUrl, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className={`bg-gray-100 rounded-xl overflow-hidden ${className}`}>
        <Skeleton className={`w-full h-[${type === "leaderboard" ? "90" : type === "sidebar" ? "250" : "90"}px]`} />
      </div>
    );
  }

  if (!ad) return null;

  return (
    <div className={`relative overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <button onClick={handleClick} className="w-full text-left cursor-pointer block" aria-label={ad.altText || "Publicidad"}>
        <img
          src={ad.imageUrl}
          alt={ad.altText || "Publicidad"}
          className="w-full h-auto object-contain"
          style={{ maxHeight: ad.height }}
        />
      </button>
      <div className="absolute bottom-1 right-2 text-[10px] text-gray-400 bg-white/80 px-1.5 py-0.5 rounded">
        Anuncio
      </div>
    </div>
  );
}
