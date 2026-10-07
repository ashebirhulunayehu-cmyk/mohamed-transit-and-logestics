import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	title: "Dashboard — Data Encoder",
	description: "Review your encoder service records and approval activity.",
};

export default function EncoderPage() {
	redirect("/en/admin/data-encoder/dashboard");
}
