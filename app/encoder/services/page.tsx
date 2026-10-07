import type { Metadata } from "next";
import EncoderServicesPage from "@/components/data-encoder/EncoderServicesPage";

export const metadata: Metadata = {
  title: "Services — Data Encoder",
  description: "Review Data Encoder service records and workflow status.",
};

export default function EncoderServicesRoutePage() {
  return <EncoderServicesPage />;
}
