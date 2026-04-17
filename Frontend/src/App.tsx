import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import OAuthCallback from "./pages/auth/OAuthCallback";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import InstructorDashboard from "./pages/instructor/InstructorDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CourseCatalog from "./pages/courses/CourseCatalog";
import CourseDetail from "./pages/courses/CourseDetail";
import LessonViewer from "./pages/courses/LessonViewer";
import MyCourses from "./pages/instructor/MyCourses";
import CourseEditor from "./pages/instructor/CourseEditor";
import { AITutorPage } from "./pages/ai-tutor/AITutorPage";
import { PeerReviewPage } from "./pages/peer-review/PeerReviewPage";
import StudentHealthPage from "./pages/health/StudentHealthPage";
import InstructorHealthPage from "./pages/health/InstructorHealthPage";
import IntegrityDashboardPage from "./pages/integrity/IntegrityDashboardPage";
import ProfilePage from "./pages/profile/ProfilePage";
import SettingsPage from "./pages/settings/SettingsPage";
import LeaderboardPage from "./pages/community/LeaderboardPage";
import ForumPage from "./pages/community/ForumPage";
import PricingPage from "./pages/billing/PricingPage";
import LiveClassesPage from "./pages/courses/LiveClassesPage";
import StudyGroupsPage from "./pages/community/StudyGroupsPage";
import PortfolioPage from "./pages/portfolio/PortfolioPage";
import CareerOutcomesPage from "./pages/career/CareerOutcomesPage";
import AdaptiveLearningPage from "./pages/admin/AdaptiveLearningPage";
import VivaAssessmentPage from "./pages/assessment/VivaAssessmentPage";
import AdminDashboardEnhanced from "./pages/admin/AdminDashboard.Enhanced";
import MessagingPage from "./pages/messaging/MessagingPage";
import PaymentForm from "./components/billing/PaymentForm";
import GDPRCompliancePage from "./pages/privacy/GDPRCompliancePage";
import IDEEditorPage from "./pages/ide/IDEEditorPage";
import CertificationGalleryPage from "./pages/certification/CertificationGalleryPage";
import BlockchainCertificateViewerPage from "./pages/certification/BlockchainCertificateViewerPage";
import AdvancedSearchPage from "./pages/search/AdvancedSearchPage";
import OrganizationBrandingPage from "./pages/admin/OrganizationBrandingPage";

const NotFound = () => (
  <div style={{ padding: "2rem", textAlign: "center" }}>
    <h1>404 — Page not found</h1>
  </div>
);

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/auth/callback" element={<OAuthCallback />} />

      {/* Course browsing (public) */}
      <Route path="/courses" element={<CourseCatalog />} />
      <Route path="/courses/:id" element={<CourseDetail />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/privacy" element={<GDPRCompliancePage />} />
      <Route path="/search" element={<AdvancedSearchPage />} />

      {/* Student routes */}
      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/courses/:courseId/learn" element={<LessonViewer />} />
        <Route path="/ai-tutor" element={<AITutorPage />} />
        <Route path="/peer-review" element={<PeerReviewPage />} />
        <Route path="/health/:courseId" element={<StudentHealthPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/forum" element={<ForumPage />} />
        <Route path="/live-classes" element={<LiveClassesPage />} />
        <Route path="/study-groups" element={<StudyGroupsPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/career-outcomes" element={<CareerOutcomesPage />} />
        <Route path="/adaptive-learning" element={<AdaptiveLearningPage />} />
        <Route path="/viva-assessment" element={<VivaAssessmentPage />} />
        <Route path="/messages" element={<MessagingPage />} />
        <Route path="/checkout" element={<PaymentForm />} />
        <Route path="/ide-editor" element={<IDEEditorPage />} />
        <Route path="/certifications" element={<CertificationGalleryPage />} />
        <Route
          path="/blockchain-certificates"
          element={<BlockchainCertificateViewerPage />}
        />
      </Route>

      {/* Instructor routes */}
      <Route element={<ProtectedRoute allowedRoles={["instructor"]} />}>
        <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
        <Route path="/instructor/courses" element={<MyCourses />} />
        <Route path="/instructor/courses/:id/edit" element={<CourseEditor />} />
        <Route
          path="/instructor/health/:courseId"
          element={<InstructorHealthPage />}
        />
        <Route
          path="/instructor/integrity"
          element={<IntegrityDashboardPage />}
        />
        <Route
          path="/instructor/integrity/:assessmentId"
          element={<IntegrityDashboardPage />}
        />
        <Route path="/instructor/live-classes" element={<LiveClassesPage />} />
        <Route path="/instructor/messages" element={<MessagingPage />} />
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route
          path="/admin/dashboard-enhanced"
          element={<AdminDashboardEnhanced />}
        />
        <Route
          path="/admin/adaptive-learning"
          element={<AdaptiveLearningPage />}
        />
        <Route path="/admin/messages" element={<MessagingPage />} />
        <Route path="/admin/branding" element={<OrganizationBrandingPage />} />
      </Route>

      {/* Default */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
