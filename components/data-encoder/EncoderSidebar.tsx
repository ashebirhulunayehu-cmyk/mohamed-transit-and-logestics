'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  UsersRound,
  BriefcaseBusiness,
  MessageSquare,
  Bell,
  UserCircle,
  ChevronDown,
  Plus,
  X,
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  section?: string;
  description?: string;
  badge?: number | string;
  badgeColor?: string;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
  defaultOpen?: boolean;
}

interface EncoderSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSectionClick?: (sectionId: string) => void;
  activeSection?: string;
  stats?: {
    draftServices?: number;
    pendingApprovals?: number;
    recentCustomers?: number;
    recentServices?: number;
  };
}

export default function EncoderSidebar({
  isOpen,
  onClose,
  onSectionClick,
  activeSection,
  stats = {},
}: EncoderSidebarProps) {
  const pathname = usePathname();
  const firstSegment = pathname.split('/').filter(Boolean)[0];
  const locale = firstSegment === 'am' || firstSegment === 'en' ? firstSegment : 'en';
  const encoderBase = `/${locale}/admin/data-encoder`;
  const sections: SidebarSection[] = useMemo(
    () => [
      {
        title: 'Overview',
        defaultOpen: true,
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, href: `${encoderBase}/dashboard` },
          { id: 'drafts', label: 'Draft Services', icon: <FileText className="h-4 w-4" />, href: `${encoderBase}/draft-services`, badge: stats.draftServices, badgeColor: 'bg-sky-700' },
        ],
      },
      {
        title: 'Data Entry',
        defaultOpen: true,
        items: [
          { id: 'create-customer', label: 'Create Customer', icon: <UsersRound className="h-4 w-4" />, href: `${encoderBase}/customers` },
          { id: 'customer-list', label: 'Customer List', icon: <UsersRound className="h-4 w-4" />, href: `${encoderBase}/customers` },
          { id: 'create-service', label: 'Create Service', icon: <Plus className="h-4 w-4" />, href: `${encoderBase}/services/new` },
          { id: 'services-list', label: 'Services', icon: <BriefcaseBusiness className="h-4 w-4" />, href: `${encoderBase}/services` },
        ],
      },
      {
        title: 'Documents',
        defaultOpen: true,
        items: [
          { id: 'documents', label: 'Documents', icon: <FileText className="h-4 w-4" />, href: `${encoderBase}/documents`, description: 'Review and upload service documents' },
        ],
      },
      {
        title: 'Communication',
        defaultOpen: true,
        items: [
          { id: 'messages', label: 'Messages', icon: <MessageSquare className="h-4 w-4" />, href: `${encoderBase}/messages` },
          { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" />, href: `${encoderBase}/notifications` },
        ],
      },
      {
        title: 'Account',
        defaultOpen: true,
        items: [
          { id: 'profile', label: 'Profile', icon: <UserCircle className="h-4 w-4" />, href: `${encoderBase}/profile` },
        ],
      },
    ],
    [encoderBase, stats.draftServices],
  );

  const sectionId = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const [expandedSections, setExpandedSections] = useState<Set<string>>(() =>
    new Set(sections.filter((section) => section.defaultOpen).map((section) => sectionId(section.title))),
  );

  const toggleSection = (sectionIdValue: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionIdValue)) {
      newExpanded.delete(sectionIdValue);
    } else {
      newExpanded.add(sectionIdValue);
    }
    setExpandedSections(newExpanded);
  };

  const navLinkClass =
    'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900';

  const activeLinkClass = (id: string) =>
    `${navLinkClass} ${activeSection === id ? '!bg-blue-600 !text-white shadow-sm' : ''}`;

  const handleItemClick = (item: SidebarItem) => {
    onSectionClick?.(item.id);
    if (item.section) {
      const element = document.getElementById(item.section);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    onClose?.();
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-slate-200 bg-white text-slate-900 transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-[76px] items-center gap-3 border-b border-slate-200 px-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
            M
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">MOT Import Services</p>
            <p className="text-xs text-slate-500">Data Operations</p>
          </div>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav aria-label="Data Encoder navigation" className="flex-1 space-y-2 overflow-y-auto px-3 py-5">
          {sections.map((section) => {
            const sectionKey = sectionId(section.title);
            const isExpanded = expandedSections.has(sectionKey);
            return (
              <div key={section.title}>
                <button
                  type="button"
                  onClick={() => toggleSection(sectionKey)}
                  className="flex w-full items-center justify-between px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 transition hover:text-slate-600"
                >
                  {section.title}
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {isExpanded && (
                  <div className="mt-1 space-y-1">
                    {section.items.map((item) => {
                      const content = (
                        <>
                          {item.icon}
                          <span className="min-w-0 flex-1">{item.label}</span>
                          {item.badge !== undefined && typeof item.badge === 'number' && item.badge > 0 && (
                            <span
                              className={`inline-flex min-w-fit items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold text-white ${
                                item.badgeColor || 'bg-slate-600'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      );

                      const classes = `${activeLinkClass(item.id)} ${item.href ? 'block' : ''}`;

                      if (item.href) {
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => handleItemClick(item)}
                            className={classes}
                            title={item.description}
                          >
                            {content}
                          </Link>
                        );
                      }

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleItemClick(item)}
                          className={classes}
                          title={item.description}
                        >
                          {content}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">DE</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">Data Encoder</p>
              <p className="text-xs text-slate-500">Import Operations</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
