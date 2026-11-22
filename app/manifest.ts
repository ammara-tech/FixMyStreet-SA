import type { MetadataRoute } from "next";

/* Makes FixMyStreet SA installable: "Add to Home screen" opens it full screen, like an app */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FixMyStreet SA",
    short_name: "FixMyStreet",
    description: "Report it, vote on it, track it.",
    start_url: "/",
    display: "standalone",
    background_color: "#141416",
    theme_color: "#141416",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
