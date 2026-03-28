import { format } from 'date-fns';
import { ComponentStock, Transaction, UserProfile } from '../types';

interface UseComponentInventoryLogicProps {
  t: any;
  activeTab: string;
}

export const useComponentInventoryLogic = ({ t }: { t: any }) => {
  const safeFormatDate = (dateStr: string | undefined, formatStr: string) => {
    if (!dateStr) return t.na;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return t.invalidDate;
    return format(d, formatStr);
  };

  const getUsername = (userId: string, users: Record<string, UserProfile>) => {
    return users[userId]?.username || userId || t.unknown;
  };

  return {
    safeFormatDate,
    getUsername
  };
};
