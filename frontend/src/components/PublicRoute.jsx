import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * PublicRoute protects routes that should only be accessible to unauthenticated users.
 * If a user is already logged in, they are redirected to the dashboard (or a default
 * authenticated route). While loading the auth state, a simple loading indicator is shown.
 */
export default function PublicRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div>
        <p>Loading...</p>
      </div>
    );
  }

  // If a user is logged in, prevent access to public routes (e.g., login/register).
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // No user => allow access to the public page.
  return children;
}
