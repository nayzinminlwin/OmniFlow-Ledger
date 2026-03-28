import { User } from 'firebase/auth';

interface UseLayoutLogicProps {
  user: User | null;
  t: any;
}

export const useLayoutLogic = ({ user, t }: UseLayoutLogicProps) => {
  const displayName = user?.displayName || user?.email?.split('@')[0] || t.defaultUser;

  return {
    displayName
  };
};
