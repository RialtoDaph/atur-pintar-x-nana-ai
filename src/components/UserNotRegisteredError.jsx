import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const UserNotRegisteredError = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F2F4F7] px-4">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-sm border border-[#E2E8F0]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-[#FF6A00]/10">
            <ShieldAlert className="w-8 h-8 text-[#FF6A00]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-3">Akses Dibatasi</h1>
          <p className="text-[#8FA4C8] text-sm mb-6">
            Anda tidak terdaftar untuk menggunakan aplikasi ini. Hubungi admin untuk meminta akses.
          </p>
          <div className="p-4 bg-[#F8FAFC] rounded-xl text-sm text-[#4A5568] text-left mb-6">
            <p className="font-medium mb-2">Jika ini adalah kesalahan, Anda dapat:</p>
            <ul className="space-y-1.5 text-[#8FA4C8]">
              <li>• Pastikan Anda login dengan akun yang benar</li>
              <li>• Hubungi admin aplikasi untuk meminta akses</li>
              <li>• Coba logout dan login kembali</li>
            </ul>
          </div>
          <button
            onClick={() => base44.auth.logout()}
            className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-[#FF6A00] hover:bg-[#e05e00] transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;