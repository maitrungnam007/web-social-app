import { useState } from "react";
import toast from "react-hot-toast";
import { reportsApi, ReportTargetType, ReportReason } from "../services";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    targetType: 'post' | 'comment' | 'user';
    targetId: number | string;
    targetName?: string;
}

const REPORT_REASONS = [
    { value: ReportReason.Spam, label: 'Spam hoặc quảng cáo' },
    { value: ReportReason.Harassment, label: 'Quấy rối hoặc bắt nạt' },
    { value: ReportReason.Violence, label: 'Bạo lực hoặc nội dung gây hại' },
    { value: ReportReason.HateSpeech, label: 'Ngôn từ kích động thù địch' },
    { value: ReportReason.InappropriateContent, label: 'Nội dung không phù hợp' },
    { value: ReportReason.Other, label: 'Lý do khác' },
];

const TARGET_LABELS = {
    post: 'bài viết',
    comment: 'bình luận',
    user: 'người dùng'
};

const TARGET_TYPE_MAP = {
    post: ReportTargetType.Post,
    comment: ReportTargetType.Comment,
    user: ReportTargetType.User
};

export default function ReportModal({ isOpen, onClose, targetType, targetId, targetName }: Props) {
    const [reason, setReason] = useState<ReportReason | null>(null);
    const [details, setDetails] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (reason === null) {
            toast.error("Vui lòng chọn lý do báo cáo");
            return;
        }

        setSubmitting(true);
        
        try {
            const result = await reportsApi.createReport({
                targetType: TARGET_TYPE_MAP[targetType],
                targetId: String(targetId), // Convert to string
                reason: reason,
                description: details || undefined
            });

            if (result.success) {
                toast.success(`Đã gửi báo cáo ${TARGET_LABELS[targetType]}`);
                setReason(null);
                setDetails('');
                onClose();
            } else {
                toast.error(result.message || "Không thể gửi báo cáo");
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi gửi báo cáo");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setReason(null);
        setDetails('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div 
                className="absolute inset-0 bg-black/50"
                onClick={handleClose}
            />
            
            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Báo cáo {TARGET_LABELS[targetType]}
                </h3>
                
                {targetName && (
                    <p className="text-sm text-gray-500 mb-4">
                        {targetType === 'user' ? 'Người dùng: ' : ''}{targetName}
                    </p>
                )}

                {/* Lý do báo cáo */}
                <div className="space-y-1 mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Chọn lý do:</p>
                    {REPORT_REASONS.map((r) => (
                        <label 
                            key={r.value} 
                            className={`flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2.5 rounded-lg transition-colors ${
                                reason === r.value ? 'bg-blue-50 border border-blue-200' : ''
                            }`}
                        >
                            <input 
                                type="radio" 
                                name="reportReason" 
                                value={r.value} 
                                checked={reason === r.value}
                                onChange={() => setReason(r.value)}
                                className="w-4 h-4 text-blue-500 focus:ring-blue-500" 
                            />
                            <span className="text-sm text-gray-700">{r.label}</span>
                        </label>
                    ))}
                </div>

                {/* Mô tả chi tiết */}
                <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Mô tả chi tiết (tùy chọn):
                    </label>
                    <textarea 
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="Mô tả thêm về vấn đề bạn gặp phải..."
                        className="w-full border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                    />
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        onClick={handleClose}
                    >
                        Hủy
                    </button>
                    <button
                        className="flex-1 px-4 py-2.5 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
                        onClick={handleSubmit}
                        disabled={submitting || reason === null}
                    >
                        {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                    </button>
                </div>
            </div>
        </div>
    );
}
