
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { QuestionManagement } from './pages/admin/QuestionManagement';
import { MockExamGenerator } from './pages/admin/MockExamGenerator';
import { ExamPrintPage } from './pages/admin/ExamPrintPage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';
import { SystemSettingsPage } from './pages/admin/SystemSettingsPage';
import { AdminSupportPage } from './pages/admin/AdminSupportPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { ExamSelectPage } from './pages/student/ExamSelectPage';
import { ExamHistoryPage } from './pages/student/ExamHistoryPage';
import { StudentSupportPage } from './pages/student/StudentSupportPage';
import { ExamPlayer } from './pages/exam/ExamPlayer';
import { WrongAnswerNote } from './pages/student/WrongAnswerNote';
import { PracticeMode } from './pages/practice/PracticeMode';
import { StudentAnalyticsPage } from './pages/student/StudentAnalyticsPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';

// Layout & Auth
import { AdminLayout } from './layouts/AdminLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/questions" element={<QuestionManagement />} />
            <Route path="/admin/exam/:examId/print" element={<ExamPrintPage />} />
            <Route path="/admin/mock-exam" element={<MockExamGenerator />} />
            <Route path="/admin/analytics" element={<AnalyticsPage />} />
            <Route path="/admin/settings" element={<SystemSettingsPage />} />
            <Route path="/admin/support" element={<AdminSupportPage />} />
          </Route>
        </Route>

        {/* Student Routes */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/exam" element={<ExamSelectPage />} />
          <Route path="/student/history" element={<ExamHistoryPage />} />
          <Route path="/student/support" element={<StudentSupportPage />} />
          <Route path="/student/practice" element={<PracticeMode />} />
          <Route path="/student/review" element={<WrongAnswerNote />} />
          <Route path="/student/analytics" element={<StudentAnalyticsPage />} />
          <Route path="/student/profile" element={<StudentProfilePage />} />
          <Route path="/exam/:examId" element={<ExamPlayer />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
