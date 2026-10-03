import { useEffect } from "react";
import "./ConfirmDialog.css";

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    isDangerous = false,
}) {
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onCancel?.();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onCancel]);

    if (!isOpen) {
        return null;
    }

    return (
        <>
            <div
                className="confirm-dialog-backdrop"
                onClick={onCancel}
                aria-hidden="true"
            />

            <div
                className="confirm-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-message"
            >
                <div className="confirm-dialog-content">
                    <h2 id="confirm-dialog-title" className="confirm-dialog-title">
                        {title}
                    </h2>

                    <p id="confirm-dialog-message" className="confirm-dialog-message">
                        {message}
                    </p>

                    <div className="confirm-dialog-actions">
                        <button
                            type="button"
                            className="confirm-dialog-btn confirm-dialog-btn-cancel"
                            onClick={onCancel}
                        >
                            {cancelLabel}
                        </button>

                        <button
                            type="button"
                            className={`confirm-dialog-btn confirm-dialog-btn-confirm${
                                isDangerous ? " confirm-dialog-btn-danger" : ""
                            }`}
                            onClick={onConfirm}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
