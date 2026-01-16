import { Navigate, Outlet } from 'react-router-dom';
import { AuthService } from '../../services/authService';

interface ProtectedRouteProps {
    allowedRoles?: ('student' | 'admin')[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const user = AuthService.getCurrentUser();

    // 1. Check if user is logged in
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 2. Check if user has required role (if roles are specified)
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on their actual role
        if (user.role === 'admin') return <Navigate to="/admin" replace />;
        return <Navigate to="/student/dashboard" replace />;
    }

    // 3. Render child routes
    return <Outlet />;
};
