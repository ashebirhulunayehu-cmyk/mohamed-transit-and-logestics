import { 
  AccountDetailsCard, 
  SecurityControlsCard, 
  RecentActivityList 
} from "@/features/profile";

export default function ProfilePage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Account</p>
        <h1 className="text-2xl font-bold text-slate-900">Profile & security</h1>
        <p className="text-sm text-slate-500">Valuation & Compliance Assessor</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccountDetailsCard />
        <SecurityControlsCard />
      </div>

      <RecentActivityList />
    </div>
  );
}