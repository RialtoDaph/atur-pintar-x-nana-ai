import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function AdminProtect({ children }) {
  const navigate = useNavigate();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    base44.auth.me()
      .then(user => {
        if (user?.role !== 'admin') {
          navigate('/Dashboard', { replace: true });
        } else {
          setVerified(true);
        }
      })
      .catch(() => navigate('/Dashboard', { replace: true }));
  }, []);

  if (!verified) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#F2F4F7]">
        <div className="w-8 h-8 border-4 border-[#E2E8F0] border-t-[#FF6A00] rounded-full animate-spin" />
      </div>
    );
  }

  return children;
}