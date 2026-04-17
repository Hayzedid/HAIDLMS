import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, Link } from 'react-router-dom';
import { InstructorHealthDashboard } from '../../components/health/InstructorHealthDashboard';
const InstructorHealthPage = () => {
    const { courseId } = useParams();
    if (!courseId) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-2", children: "Invalid Course" }), _jsx("p", { className: "text-gray-600 mb-4", children: "No course ID provided." }), _jsx(Link, { to: "/instructor/courses", className: "px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition", children: "\u2190 Back to My Courses" })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gray-50", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8", children: [_jsxs("div", { className: "mb-8", children: [_jsx(Link, { to: "/instructor/courses", className: "inline-flex items-center text-blue-600 hover:text-blue-700 mb-4", children: "\u2190 Back to My Courses" }), _jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "\uD83D\uDCCA Course Health Dashboard" }), _jsx("p", { className: "text-gray-600", children: "Monitor learner health and identify students who may need support" })] }), _jsx(InstructorHealthDashboard, { courseId: courseId })] }) }));
};
export default InstructorHealthPage;
