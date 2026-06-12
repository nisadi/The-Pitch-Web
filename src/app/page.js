import HomeLocations from "@/components/home/HomeLocations";
import HomePageClient from "./HomePageClient";

export default function Home() {
  return <HomePageClient locationsSection={<HomeLocations />} />;
}
