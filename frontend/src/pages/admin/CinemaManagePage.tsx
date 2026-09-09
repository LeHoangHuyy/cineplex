import React, { useState, useEffect, useRef } from 'react';
import { Film, Plus, Edit2, Trash2, MapPin, Grid, X, Save, Heart, Sparkles, Check, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Cinema, Room, RoomType, Seat, SeatType } from '../../types';
import { adminApi, cinemaApi, uploadApi } from '../../api';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const CinemaManagePage: React.FC = () => {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);

  // Cinema Modal
  const [isCinemaModalOpen, setIsCinemaModalOpen] = useState(false);
  const [editingCinema, setEditingCinema] = useState<Cinema | null>(null);
  const [cinemaName, setCinemaName] = useState('');
  const [cinemaAddress, setCinemaAddress] = useState('');
  const [cinemaCity, setCinemaCity] = useState('');
  const [cinemaPhone, setCinemaPhone] = useState('');
  const [cinemaImage, setCinemaImage] = useState('');
  const [uploadingCinemaImage, setUploadingCinemaImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const cinemaImageFileInputRef = useRef<HTMLInputElement>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete Confirm Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'cinema' | 'room';
    id: string;
    name: string;
    isLoading?: boolean;
    errorMessage?: string | null;
  }>({
    isOpen: false,
    type: 'cinema',
    id: '',
    name: '',
    isLoading: false,
    errorMessage: null,
  });

  const handleUploadCinemaImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCinemaImage(true);
    setUploadError(null);
    try {
      const res = await uploadApi.uploadImage(file);
      setCinemaImage(res.data.url);
    } catch (err: any) {
      const msg =
        err.response?.status === 413
          ? 'File ảnh quá lớn (vượt quá dung lượng 25MB cho phép).'
          : err.response?.data?.message || err.message || 'Không thể upload ảnh lên MinIO.';
      setUploadError(msg);
    } finally {
      setUploadingCinemaImage(false);
      if (cinemaImageFileInputRef.current) {
        cinemaImageFileInputRef.current.value = '';
      }
    }
  };

  // Room Modal
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [selectedCinemaForRoom, setSelectedCinemaForRoom] = useState<Cinema | null>(null);
  const [roomName, setRoomName] = useState('');
  const [roomRows, setRoomRows] = useState(8);
  const [roomCols, setRoomCols] = useState(12);
  const [roomType, setRoomType] = useState<RoomType>('STANDARD_2D');

  // Seat Layout Modal
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [roomSeats, setRoomSeats] = useState<Seat[]>([]);
  const [selectedSeatTypeToBrush, setSelectedSeatTypeToBrush] = useState<SeatType>('VIP');
  const [savingSeats, setSavingSeats] = useState(false);

  useEffect(() => {
    fetchCinemas();
  }, []);

  const fetchCinemas = async () => {
    setLoading(true);
    try {
      const res = await cinemaApi.getAll();
      setCinemas(res.data);
    } catch (err) {
      console.error('Error fetching cinemas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddCinema = () => {
    setEditingCinema(null);
    setCinemaName('');
    setCinemaAddress('');
    setCinemaCity('Hà Nội');
    setCinemaPhone('');
    setCinemaImage('');
    setUploadError(null);
    setIsCinemaModalOpen(true);
  };

  const handleOpenEditCinema = (c: Cinema) => {
    setEditingCinema(c);
    setCinemaName(c.name);
    setCinemaAddress(c.address);
    setCinemaCity(c.city);
    setCinemaPhone(c.phone || '');
    setCinemaImage(c.imageUrl || '');
    setUploadError(null);
    setIsCinemaModalOpen(true);
  };

  const handleSaveCinema = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!cinemaImage) {
      setUploadError('Vui lòng tải lên hình ảnh cho cụm rạp.');
      return;
    }

    const payload = {
      name: cinemaName,
      address: cinemaAddress,
      city: cinemaCity,
      phone: cinemaPhone,
      imageUrl: cinemaImage,
    };
    try {
      if (editingCinema) {
        await adminApi.updateCinema(editingCinema.id, payload);
      } else {
        await adminApi.createCinema(payload);
      }
      setIsCinemaModalOpen(false);
      fetchCinemas();
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Không thể lưu cụm rạp.');
    }
  };

  const promptDeleteCinema = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      type: 'cinema',
      id,
      name,
      isLoading: false,
      errorMessage: null,
    });
  };

  const promptDeleteRoom = (roomId: string, rName: string) => {
    setDeleteModal({
      isOpen: true,
      type: 'room',
      id: roomId,
      name: rName,
      isLoading: false,
      errorMessage: null,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.id) return;
    setDeleteModal((prev) => ({ ...prev, isLoading: true, errorMessage: null }));
    try {
      if (deleteModal.type === 'cinema') {
        await adminApi.deleteCinema(deleteModal.id);
      } else {
        await adminApi.deleteRoom(deleteModal.id);
      }
      setDeleteModal((prev) => ({ ...prev, isOpen: false }));
      fetchCinemas();
    } catch (err: any) {
      const defaultMsg =
        deleteModal.type === 'cinema'
          ? 'Không thể xóa rạp. Rạp có thể đang chứa phòng chiếu có suất chiếu đang hoạt động.'
          : 'Không thể xóa phòng chiếu. Phòng chiếu có thể đang có suất chiếu hoặc vé liên quan.';
      setDeleteModal((prev) => ({
        ...prev,
        isLoading: false,
        errorMessage: err.response?.data?.message || defaultMsg,
      }));
    }
  };

  const handleOpenAddRoom = (c: Cinema) => {
    setSelectedCinemaForRoom(c);
    setRoomName(`Phòng Chiếu 0${(c.rooms?.length || 0) + 1}`);
    setRoomRows(8);
    setRoomCols(12);
    setRoomType('STANDARD_2D');
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCinemaForRoom) return;
    try {
      await adminApi.createRoom({
        cinemaId: selectedCinemaForRoom.id,
        name: roomName,
        totalRows: Number(roomRows),
        totalCols: Number(roomCols),
        roomType,
      });
      setIsRoomModalOpen(false);
      fetchCinemas();
    } catch (err) {
      console.error('Error saving room:', err);
    }
  };

  // Seat Layout Builder
  const handleOpenSeatBuilder = async (r: Room) => {
    setCurrentRoom(r);
    setIsSeatModalOpen(true);
    try {
      const res = await adminApi.getRoomSeats(r.id);
      setRoomSeats(res.data);
    } catch (err) {
      console.error('Error fetching room seats:', err);
    }
  };

  const handleToggleSeatTypeInBuilder = (index: number) => {
    const updated = [...roomSeats];
    const seat = updated[index];
    seat.seatType = selectedSeatTypeToBrush;
    setRoomSeats(updated);
  };

  const handleSaveSeatLayout = async () => {
    if (!currentRoom) return;
    setSavingSeats(true);
    try {
      await adminApi.updateRoomSeats({
        roomId: currentRoom.id,
        seats: roomSeats,
      });
      setIsSeatModalOpen(false);
      setToastMessage({ type: 'success', text: 'Đã cập nhật sơ đồ ghế phòng chiếu thành công!' });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error('Error saving seat layout:', err);
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi lưu sơ đồ ghế.' });
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setSavingSeats(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Film className="w-7 h-7 text-emerald-600" />
            QUẢN LÝ RẠP & PHÒNG CHIẾU
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý cụm rạp toàn quốc, thêm phòng chiếu chuẩn IMAX/4DX và cấu hình sơ đồ ghế trực quan.
          </p>
        </div>

        <button
          onClick={handleOpenAddCinema}
          className="py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Cụm Rạp Mới</span>
        </button>
      </div>

      {/* Cinema Cards List */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Đang tải danh sách rạp...</div>
        ) : cinemas.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm">
            Chưa có cụm rạp nào. Nhấn "Thêm Cụm Rạp Mới" để bắt đầu.
          </div>
        ) : (
          cinemas.map((cinema) => (
            <div
              key={cinema.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-sm"
            >
              {/* Cinema Branch Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-900">{cinema.name}</h3>
                    <p className="text-xs text-slate-500">{cinema.address} • {cinema.city}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenAddRoom(cinema)}
                    className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-emerald-700 font-bold text-xs flex items-center gap-1.5 transition border border-slate-200 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm Phòng Chiếu
                  </button>
                  <button
                    onClick={() => handleOpenEditCinema(cinema)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-600 transition shadow-sm border border-slate-200"
                    title="Sửa rạp"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => promptDeleteCinema(cinema.id, cinema.name)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-rose-500 hover:text-white text-slate-600 transition shadow-sm border border-slate-200"
                    title="Xóa rạp"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Rooms List */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Phòng Chiếu ({cinema.rooms?.length || 0} phòng)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cinema.rooms?.map((room) => (
                    <div
                      key={room.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="space-y-1">
                        <span className="font-bold text-sm text-slate-900 block">{room.name}</span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="text-emerald-600 font-bold">{room.roomType}</span>
                          <span>•</span>
                          <span>{room.totalSeats || room.totalRows * room.totalCols} ghế ({room.totalRows}x{room.totalCols})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenSeatBuilder(room)}
                          className="p-2 rounded-xl bg-white hover:bg-emerald-600 hover:text-white text-slate-600 transition shadow-sm border border-slate-200"
                          title="Cấu hình sơ đồ ghế"
                        >
                          <Grid className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => promptDeleteRoom(room.id, room.name)}
                          className="p-2 rounded-xl bg-white hover:bg-rose-600 hover:text-white text-slate-600 transition shadow-sm border border-slate-200"
                          title="Xóa phòng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cinema Modal */}
      {isCinemaModalOpen && (
        <div
          onClick={() => setIsCinemaModalOpen(false)}
          className="fixed inset-0 !m-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-800"
          >
            <button
              onClick={() => setIsCinemaModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black text-slate-900 mb-5">
              {editingCinema ? 'SỬA THÔNG TIN RẠP' : 'THÊM CỤM RẠP MỚI'}
            </h3>

            <form onSubmit={handleSaveCinema} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên Cụm Rạp *</label>
                <input
                  type="text"
                  required
                  value={cinemaName}
                  onChange={(e) => setCinemaName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Địa Chỉ *</label>
                <input
                  type="text"
                  required
                  value={cinemaAddress}
                  onChange={(e) => setCinemaAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tỉnh / Thành Phố *</label>
                  <input
                    type="text"
                    required
                    value={cinemaCity}
                    onChange={(e) => setCinemaCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số Điện Thoại</label>
                  <input
                    type="text"
                    value={cinemaPhone}
                    onChange={(e) => setCinemaPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 text-xs">Hình Ảnh Rạp *</label>
                  {cinemaImage && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={uploadingCinemaImage}
                        onClick={() => cinemaImageFileInputRef.current?.click()}
                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition cursor-pointer"
                      >
                        Đổi ảnh khác
                      </button>
                      <button
                        type="button"
                        onClick={() => setCinemaImage('')}
                        className="text-[11px] font-bold text-rose-500 hover:text-rose-600 transition cursor-pointer"
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={cinemaImageFileInputRef}
                  onChange={handleUploadCinemaImage}
                  accept="image/*"
                  className="hidden"
                />

                {cinemaImage ? (
                  <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 h-44 flex items-center justify-center shadow-xs">
                    <img
                      src={cinemaImage}
                      alt="Cinema preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800';
                      }}
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        disabled={uploadingCinemaImage}
                        onClick={() => cinemaImageFileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-white text-slate-800 text-xs font-bold shadow-md hover:bg-slate-100 flex items-center gap-1.5 transition"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{uploadingCinemaImage ? 'Đang tải lên...' : 'Tải ảnh khác từ máy (MinIO)'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={uploadingCinemaImage}
                    onClick={() => cinemaImageFileInputRef.current?.click()}
                    className="w-full h-44 border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50/20 transition cursor-pointer disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs text-emerald-600">
                      <Upload className={`w-5 h-5 ${uploadingCinemaImage ? 'animate-bounce' : ''}`} />
                    </div>
                    <div className="text-center px-4">
                      <p className="font-bold text-xs">
                        {uploadingCinemaImage ? 'Đang tải lên MinIO...' : 'Tải hình ảnh rạp từ máy lên MinIO'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Hỗ trợ định dạng PNG, JPG, WEBP</p>
                    </div>
                  </button>
                )}

                {uploadError && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{uploadError}</p>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCinemaModalOpen(false)}
                  className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-600/30"
                >
                  Lưu Rạp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {isRoomModalOpen && selectedCinemaForRoom && (
        <div
          onClick={() => setIsRoomModalOpen(false)}
          className="fixed inset-0 !m-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-800"
          >
            <button
              onClick={() => setIsRoomModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black text-slate-900 mb-2">THÊM PHÒNG CHIẾU</h3>
            <p className="text-xs text-slate-500 mb-5">Rạp: {selectedCinemaForRoom.name}</p>

            <form onSubmit={handleSaveRoom} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên Phòng Chiếu *</label>
                <input
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Loại Phòng Chiếu *</label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value as RoomType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="STANDARD_2D">STANDARD 2D Digital</option>
                  <option value="IMAX_3D">IMAX 3D Laser</option>
                  <option value="FOUR_DX">4DX Chuyển Động</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số Hàng Ghế (Rows)</label>
                  <input
                    type="number"
                    min={4}
                    max={15}
                    value={roomRows}
                    onChange={(e) => setRoomRows(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số Cột Ghế (Cols)</label>
                  <input
                    type="number"
                    min={6}
                    max={20}
                    value={roomCols}
                    onChange={(e) => setRoomCols(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-600/30"
                >
                  Tạo Phòng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Seat Layout Configurator Modal */}
      {isSeatModalOpen && currentRoom && (
        <div
          onClick={() => setIsSeatModalOpen(false)}
          className="fixed inset-0 !m-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-800 max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setIsSeatModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-1">
              CẤU HÌNH SƠ ĐỒ GHẾ: {currentRoom.name}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Chọn công cụ loại ghế bên dưới, sau đó click vào từng ghế trên sơ đồ để gán loại ghế.
            </p>

            {/* Brush Tool Selector */}
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 mb-8 max-w-md">
              <span className="text-xs font-bold text-slate-500 pl-2">Chọn cọ gán:</span>
              <button
                type="button"
                onClick={() => setSelectedSeatTypeToBrush('REGULAR')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  selectedSeatTypeToBrush === 'REGULAR'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ghế Thường (1x)
              </button>
              <button
                type="button"
                onClick={() => setSelectedSeatTypeToBrush('VIP')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  selectedSeatTypeToBrush === 'VIP'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-amber-700 hover:text-amber-900'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                Ghế VIP (1.2x)
              </button>
              <button
                type="button"
                onClick={() => setSelectedSeatTypeToBrush('COUPLE')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  selectedSeatTypeToBrush === 'COUPLE'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-rose-700 hover:text-rose-900'
                }`}
              >
                <Heart className="w-3 h-3" />
                Ghế Đôi (1.8x)
              </button>
            </div>

            {/* Seat Matrix */}
            <div className="overflow-x-auto pb-6">
              <div className="min-w-[500px] flex flex-col items-center gap-2.5">
                {/* Screen Header */}
                <div className="w-full max-w-md h-2 bg-gradient-to-r from-transparent via-emerald-500 to-transparent rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)] mb-6 text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block -mt-4">
                    Màn Hình
                  </span>
                </div>

                {/* Render Seats */}
                {roomSeats.length === 0 ? (
                  <p className="text-slate-400 text-xs py-8">Đang tải sơ đồ ghế...</p>
                ) : (
                  <div className="space-y-2">
                    {Array.from(new Set(roomSeats.map((s) => s.seatRow))).map((rowLetter) => (
                      <div key={rowLetter} className="flex items-center gap-2">
                        <span className="w-6 text-center font-bold text-xs text-slate-400">
                          {rowLetter}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {roomSeats
                            .map((seat, index) => ({ seat, index }))
                            .filter(({ seat }) => seat.seatRow === rowLetter)
                            .map(({ seat, index }) => {
                              const isVIP = seat.seatType === 'VIP';
                              const isCouple = seat.seatType === 'COUPLE';

                              return (
                                <button
                                  key={seat.id || index}
                                  type="button"
                                  onClick={() => handleToggleSeatTypeInBuilder(index)}
                                  className={`w-8 h-8 rounded-lg border text-[11px] font-bold transition hover:scale-110 flex items-center justify-center shadow-sm ${
                                    isVIP
                                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                                      : isCouple
                                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                                      : 'bg-white border-slate-300 text-slate-700'
                                  }`}
                                  title={`${seat.seatCode} (${seat.seatType})`}
                                >
                                  {isCouple ? '❤️' : seat.seatNumber}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSeatModalOpen(false)}
                className="py-2 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={savingSeats}
                onClick={handleSaveSeatLayout}
                className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                {savingSeats ? 'Đang lưu...' : 'LƯU SƠ ĐỒ GHẾ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Cinema / Room) */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => !deleteModal.isLoading && setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        title={deleteModal.type === 'cinema' ? 'Xác Nhận Xóa Cụm Rạp' : 'Xác Nhận Xóa Phòng Chiếu'}
        message={
          deleteModal.type === 'cinema' ? (
            <>
              Bạn có chắc chắn muốn xóa cụm rạp <strong className="text-slate-900 font-bold">"{deleteModal.name}"</strong> và toàn bộ phòng chiếu liên quan không?
            </>
          ) : (
            <>
              Bạn có chắc chắn muốn xóa phòng chiếu <strong className="text-slate-900 font-bold">"{deleteModal.name}"</strong> không?
            </>
          )
        }
        subMessage="Lưu ý: Dữ liệu bị xóa sẽ không thể phục hồi."
        confirmText="Xác Nhận Xóa"
        cancelText="Hủy Bỏ"
        type="danger"
        isLoading={deleteModal.isLoading}
        errorMessage={deleteModal.errorMessage}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-bold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-rose-600 border-rose-500 text-white'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};
