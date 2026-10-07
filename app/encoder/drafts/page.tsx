import type { Metadata } from "next";
import EncoderDraftsDashboard from "@/components/data-encoder/EncoderDraftsDashboard";

export const metadata: Metadata = {
	title: "Draft Services — Data Encoder",
	description: "Review and submit saved data encoder service drafts.",
};

export default function EncoderDraftsPage() {
	return <EncoderDraftsDashboard />;
}
