export default function SkeletonCard({ className = "" }) {
    return (
        <div
            className={`skeleton-card ${className}`.trim()}
            aria-hidden="true"
        >
            <div className="skeleton-card-line skeleton-card-line-title" />
            <div className="skeleton-card-line skeleton-card-line-value" />
            <div className="skeleton-card-line skeleton-card-line-meta" />
        </div>
    );
}
