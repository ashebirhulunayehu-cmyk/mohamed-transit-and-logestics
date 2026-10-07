import type { Metadata } from "next";
import EncoderServiceWizard from "@/components/data-encoder/EncoderServiceWizard";

export const metadata: Metadata = {
	title: "Create Service — Data Encoder",
	description: "Create and submit a Data Encoder import service.",
};

export default function EncoderNewServicePage() {
	return <EncoderServiceWizard />;
}
