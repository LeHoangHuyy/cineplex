import React, { useState } from 'react';
import { User, Mail, Phone, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword && newPassword !== confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        fullName,
        phone,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      setSuccess('Cập nhật thông tin tài khoản thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật thông tin.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 text-center py-20">
        <p className="text-slate-500 font-medium">Vui lòng đăng nhập để xem thông tin tài khoản.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            THÔNG TIN TÀI KHOẢN
          </h1>
          <p className="text-xs text-slate-500">
            Quản lý thông tin cá nhân và cài đặt bảo mật của bạn
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          {success && (
            <div className="mb-5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email đăng ký</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-500 cursor-not-allowed font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Họ và Tên</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Số Điện Thoại</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Đổi Mật Khẩu (Tùy chọn)
              </h4>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Mật khẩu hiện tại</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Mật khẩu mới</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    minLength={6}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    minLength={6}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-xs shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
              >
                {loading ? 'Đang lưu...' : 'LƯU THAY ĐỔI'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
