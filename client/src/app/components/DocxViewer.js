"use client";
import { useEffect, useRef, useState } from "react";

export default function DocxViewer({ fileUrl }) {
    const containerRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const loadDocx = async () => {
            try {
                setLoading(true);
                const res = await fetch(fileUrl);
                if (!res.ok) throw new Error("Không thể tải file dữ liệu");
                const blob = await res.blob();
                
                // Dynamically import docx-preview to prevent SSR issues
                const docx = await import("docx-preview");
                
                if (isMounted && containerRef.current) {
                    await docx.renderAsync(blob, containerRef.current, null, {
                        className: "docx-document",
                        inWrapper: true,
                        ignoreWidth: false,
                        ignoreHeight: false, 
                        ignoreFonts: false,
                        breakPages: true,
                    });
                }
            } catch (err) {
                console.error("Lỗi đọc docx:", err);
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (fileUrl) {
            loadDocx();
        }

        return () => {
            isMounted = false;
        };
    }, [fileUrl]);

    return (
        <div className="bg-gray-100 h-full w-full overflow-y-auto rounded-xl relative p-2 md:p-6 custom-scrollbar">
            {loading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-100 bg-opacity-90 rounded-xl">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mb-4"></div>
                    <p className="text-gray-700 font-medium">Đang dựng cấu trúc tài liệu Word...</p>
                </div>
            )}
            
            {error && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-red-50 text-red-500 rounded-xl">
                    <span className="text-4xl mb-3">⚠️</span>
                    <p className="font-semibold">Lỗi khi hiển thị tài liệu: {error}</p>
                </div>
            )}

            <div 
                ref={containerRef} 
                className={`w-full max-w-5xl mx-auto flex flex-col items-center justify-center ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                style={{
                    minHeight: "100%",
                }}
            />
        </div>
    );
}
