import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IDEInterface } from '../../components/ide';
import { useParams } from 'react-router-dom';
/**
 * Standalone code playground page for testing and experimentation
 * Can be accessed at /ide/playground or /lessons/:lessonId/ide
 */
export default function CodePlayground() {
    const { lessonId } = useParams();
    return (_jsxs("div", { style: { height: '100vh', display: 'flex', flexDirection: 'column' }, children: [_jsxs("div", { style: {
                    padding: '16px 24px',
                    backgroundColor: '#1f2937',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [_jsx("h1", { style: { margin: 0, fontSize: '20px', fontWeight: 600 }, children: "\uD83D\uDCBB Code Playground" }), lessonId && (_jsxs("span", { style: { fontSize: '14px', color: '#9ca3af' }, children: ["Lesson: ", lessonId] }))] }), _jsx("a", { href: "/dashboard", style: {
                            color: '#60a5fa',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: 500,
                        }, children: "\u2190 Back to Dashboard" })] }), _jsx("div", { style: { flex: 1, padding: '24px', backgroundColor: '#f9fafb' }, children: lessonId ? (_jsx(IDEInterface, { lessonId: lessonId, courseId: "00000000-0000-0000-0000-000000000000" // Placeholder for playground
                    , onSubmissionComplete: (result) => {
                        console.log('Submission result:', result);
                    } })) : (_jsxs("div", { style: { textAlign: 'center', padding: '48px' }, children: [_jsx("p", { style: { fontSize: '16px', color: '#6b7280', marginBottom: '24px' }, children: "Select a lesson or use the playground mode to start coding" }), _jsx(IDEInterface, { lessonId: "playground", courseId: "playground", initialLanguage: "python" })] })) })] }));
}
