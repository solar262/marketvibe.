import "../purple-portal.css";
import PurplePortal from "../../components/PurplePortal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function PurplePreviewPage() {
  return <PurplePortal />;
}
