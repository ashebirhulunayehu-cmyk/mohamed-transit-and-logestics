

// የመዝገብ ሁኔታዎች (Statuses) ዝርዝር
export type AssessmentStatus = 
  | 'Issued assessment' 
  | 'Blocked stage' 
  | 'Submitted for approval' 
  | 'Requested revision' 
  | 'Returned KYC';

// የአንድ መዝገብ መዋቅር (Interface)
export interface AssessmentLog {
  id: string;
  status: AssessmentStatus;
  details: string;
  timestamp: string;
  metadata?: string;
  reason?: string;
}

// የማጣሪያ እና ፍለጋ ሁኔታዎች መዋቅር
export interface AssessmentLogFilterState {
  status: AssessmentStatus | 'All';
  searchQuery: string;
}