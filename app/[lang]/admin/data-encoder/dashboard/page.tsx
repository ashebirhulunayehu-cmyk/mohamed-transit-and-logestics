import type { Metadata } from "next";
import DataEncoderDashboard from "@/components/data-encoder/DataEncoderDashboard";

export const metadata: Metadata = {
	title: "Dashboard — Data Encoder",
	description: "Monitor Data Encoder customer, service, approval, and draft activity.",
};

export default function DataEncoderDashboardPage() {
	return (
		<div className="min-h-screen w-full">
			<DataEncoderDashboard />
		</div>
	);
}
