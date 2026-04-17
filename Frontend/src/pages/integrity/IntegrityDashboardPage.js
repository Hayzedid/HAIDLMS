import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, Link } from 'react-router-dom';
import { IntegrityReviewDashboard } from '../../components/integrity/IntegrityReviewDashboard';
const IntegrityDashboardPage = () => {
    const { assessmentId } = useParams();
    return (_jsx("div", { className: "min-h-screen bg-gray-50", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8", children: [_jsxs("div", { className: "mb-8", children: [_jsx(Link, { to: "/instructor/dashboard", className: "inline-flex items-center text-blue-600 hover:text-blue-700 mb-4", children: "\u2190 Back to Dashboard" }), _jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "\uD83D\uDD12 Academic Integrity Dashboard" }), _jsx("p", { className: "text-gray-600", children: "Review flagged behavior and make decisions on integrity violations" }), assessmentId && (_jsxs("p", { className: "text-sm text-gray-500 mt-2", children: ["Filtered to Assessment: ", assessmentId] }))] }), _jsx(IntegrityReviewDashboard, { assessmentId: assessmentId })] }) }));
};
export default IntegrityDashboardPage;
