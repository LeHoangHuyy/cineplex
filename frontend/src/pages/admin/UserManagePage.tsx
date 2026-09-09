import React, { useState, useEffect } from 'react';
import { Users, Search, Lock, Unlock, Shield, UserCheck, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { User, UserStatus } from '../../types';
import { adminApi } from '../../api';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { AdminDropdown } from '../../components/common/AdminDropdown';

const STATUS_OPTIONS = [
  { id: 'ALL', label: 'Tất Cả Trạng Thái' },
  { id: 'ACTIVE', label: 'Hoạt Động (ACTIVE)' },
  { id: 'LOCKED', label: 'Đã Bị Khóa (LOCKED)' },
];

const SORT_OPTIONS = [
  { label: 'Mới nhất', sortBy: 'createdAt', direction: 'desc' },
  { label: 'Cũ nhất', sortBy: 'createdAt', direction: 'asc' },
  { label: 'Họ tên (A-Z)', sortBy: 'fullName', direction: 'asc' },
  { label: 'Họ tên (Z-A)', sortBy: 'fullName', direction: 'desc' },
  { label: 'Email (A-Z)', sortBy: 'email', direction: 'asc' },
  { label: 'Email (Z-A)', sortBy: 'email', direction: 'desc' },
];

export const UserManagePage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Status Confirm Modal State
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    user?: User;
    newStatus?: UserStatus;
    isLoading?: boolean;
    errorMessage?: string | null;
  }>({ isOpen: false });

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(currentPage, statusFilter, search, sortBy, sortDir);
    }, 250);
    return () => clearTimeout(timer);
  }, [currentPage, statusFilter, search, sortBy, sortDir]);

  const fetchUsers = async (
    page: number = currentPage,
    status: string = statusFilter,
    query: string = search,
    sort: string = sortBy,
    dir: 'asc' | 'desc' = sortDir
  ) => {
    setLoading(true);
    try {
      const res = await adminApi.getAllUsers(
        status === 'ALL' ? undefined : status,
        query.trim() ? query.trim() : undefined,
        page - 1,
        ITEMS_PER_PAGE,
        sort,
        dir
      );
      setUsers(res.data.content || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir(field === 'createdAt' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-emerald-600" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
    );
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const promptToggleStatus = (user: User) => {
    const newStatus: UserStatus = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    setStatusModal({
      isOpen: true,
      user,
      newStatus,
      isLoading: false,
      errorMessage: null,
    });
  };

  const handleConfirmToggleStatus = async () => {
    if (!statusModal.user || !statusModal.newStatus) return;
    setStatusModal((prev) => ({ ...prev, isLoading: true, errorMessage: null }));
    try {
      await adminApi.updateUserStatus(statusModal.user.id, statusModal.newStatus);
      setStatusModal({ isOpen: false });
      fetchUsers(currentPage, statusFilter, search, sortBy, sortDir);
    } catch (err: any) {
      setStatusModal((prev) => ({
        ...prev,
        isLoading: false,
        errorMessage: err.response?.data?.message || 'Không thể cập nhật trạng thái người dùng.',
      }));
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-600" />
            QUẢN LÝ NGƯỜI DÙNG
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Xem danh sách tài khoản khách hàng & quản trị viên, quản lý quyền hạn và khóa/mở tài khoản.
          </p>
        </div>

        <button
          onClick={() => fetchUsers(currentPage, statusFilter, search, sortBy, sortDir)}
          className="py-2 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition shadow-sm self-start sm:self-auto"
        >
          Làm mới ⟳
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Tìm theo tên khách hàng, email hoặc số điện thoại..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2 pl-4 pr-10 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <AdminDropdown
            label="Trạng thái"
            icon={<Filter className="w-3.5 h-3.5 text-emerald-600" />}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            options={STATUS_OPTIONS.map((st) => ({ value: st.id, label: st.label }))}
          />

          <AdminDropdown
            label="Sắp xếp"
            icon={<ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" />}
            value={`${sortBy}-${sortDir}`}
            onChange={(val) => {
              const [field, dir] = val.split('-');
              setSortBy(field);
              setSortDir(dir as 'asc' | 'desc');
              setCurrentPage(1);
            }}
            options={SORT_OPTIONS.map((opt) => ({ value: `${opt.sortBy}-${opt.direction}`, label: opt.label }))}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200 select-none">
              <tr>
                <th className="py-4 px-5">
                  <button
                    onClick={() => handleSort('fullName')}
                    className="group flex items-center gap-1.5 hover:text-emerald-600 transition font-bold"
                  >
                    <span>Người Dùng</span>
                    {renderSortIcon('fullName')}
                  </button>
                </th>
                <th className="py-4 px-4">Số Điện Thoại</th>
                <th className="py-4 px-4">Vai Trò</th>
                <th className="py-4 px-4">
                  <button
                    onClick={() => handleSort('createdAt')}
                    className="group flex items-center gap-1.5 hover:text-emerald-600 transition font-bold"
                  >
                    <span>Ngày Tham Gia</span>
                    {renderSortIcon('createdAt')}
                  </button>
                </th>
                <th className="py-4 px-4">Trạng Thái</th>
                <th className="py-4 px-5 text-right">Khóa / Mở Khóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Đang tải danh sách tài khoản...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Không tìm thấy người dùng nào.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isAdminRole = u.role === 'ROLE_ADMIN';
                  const isActive = u.status === 'ACTIVE';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-sm ${
                              isAdminRole ? 'bg-amber-600' : 'bg-emerald-600'
                            }`}
                          >
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{u.fullName}</p>
                            <p className="text-[11px] text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {u.phone || 'Chưa cập nhật'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            isAdminRole
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {isAdminRole ? '👑 QUẢN TRỊ VIÊN' : '🎟️ KHÁCH HÀNG'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium whitespace-nowrap">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isActive ? 'HOẠT ĐỘNG' : 'ĐÃ BỊ KHÓA'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {!isAdminRole && (
                          <button
                            onClick={() => promptToggleStatus(u)}
                            className={`py-1.5 px-3 rounded-xl font-bold text-xs transition flex items-center gap-1 ml-auto shadow-sm ${
                              isActive
                                ? 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
                                : 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {isActive ? (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                Khóa Tài Khoản
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3.5 h-3.5" />
                                Mở Khóa
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="py-3 px-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            Hiển thị <span className="font-bold text-slate-800">{users.length}</span> /{' '}
            <span className="font-bold text-slate-800">{totalElements}</span> người dùng
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition shadow-sm"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                    currentPage === pageNum
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition shadow-sm"
                title="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Status Confirmation Modal */}
      <ConfirmModal
        isOpen={statusModal.isOpen}
        onClose={() => !statusModal.isLoading && setStatusModal({ isOpen: false })}
        onConfirm={handleConfirmToggleStatus}
        title={statusModal.newStatus === 'LOCKED' ? 'Xác Nhận Khóa Tài Khoản' : 'Xác Nhận Mở Khóa Tài Khoản'}
        message={
          <>
            Bạn có chắc chắn muốn {statusModal.newStatus === 'LOCKED' ? 'khóa' : 'mở khóa'} tài khoản{' '}
            <strong className="text-slate-900 font-bold">"{statusModal.user?.email}"</strong> không?
          </>
        }
        subMessage={
          statusModal.newStatus === 'LOCKED'
            ? 'Người dùng bị khóa sẽ không thể đăng nhập hoặc thực hiện đặt vé.'
            : 'Tài khoản người dùng sẽ được kích hoạt trở lại trạng thái bình thường.'
        }
        confirmText={statusModal.newStatus === 'LOCKED' ? 'Khóa Tài Khoản' : 'Mở Khóa'}
        cancelText="Hủy Bỏ"
        type={statusModal.newStatus === 'LOCKED' ? 'danger' : 'warning'}
        isLoading={statusModal.isLoading}
        errorMessage={statusModal.errorMessage}
      />
    </div>
  );
};
