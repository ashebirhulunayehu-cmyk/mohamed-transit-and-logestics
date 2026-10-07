import EncoderSectionLayout from "@/components/data-encoder/EncoderSectionLayout";
import { NotificationsList } from "@/features/notifications/components/NotificationsList";

export default function DataEncoderNotificationsPage() {
  return (
    <EncoderSectionLayout
      activeSection="notifications"
      title="Notifications"
      description="Track approvals, activity, and changes affecting your import operations."
    >
      <div className="max-w-[1500px]">
        <NotificationsList />
      </div>
    </EncoderSectionLayout>
  );
}
