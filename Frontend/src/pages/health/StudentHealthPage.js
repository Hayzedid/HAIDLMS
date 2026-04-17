import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams } from 'react-router-dom';
import { StudentHealthDashboard } from '../../components/health/StudentHealthDashboard';
import { useAuth } from '../../hooks/useAuth';
const StudentHealthPage = () => {
    const { courseId } = useParams();
    const { user } = useAuth();
    if (!user || !courseId) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-2", children: "Loading..." }), _jsx("p", { className: "text-gray-600", children: "Please wait while we load your health data." })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gray-50", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "\uD83D\uDCCA Your Learning Health" }), _jsx("p", { className: "text-gray-600", children: "Track your progress and see how you're doing in this course" })] }), _jsx(StudentHealthDashboard, { userId: user.id, courseId: courseId })] }) }));
};
export default StudentHealthPage;
