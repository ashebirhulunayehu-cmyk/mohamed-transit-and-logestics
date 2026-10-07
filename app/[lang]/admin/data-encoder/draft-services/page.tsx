import type { Metadata } from "next";
import EncoderDraftsDashboard from "@/components/data-encoder/EncoderDraftsDashboard";

export const metadata: Metadata = {
	title: "Draft Services — Data Encoder",
	description: "Review, resume, submit, or discard saved Data Encoder service drafts.",
};

export default function DataEncoderDraftServicesPage() {
	return <EncoderDraftsDashboard />;
}
