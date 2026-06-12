import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function Dashboard() {
  const { user, logoutUser, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  if (loading) {
    return <div><p>Loading...</p></div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      {user ? (
        <div>
          <p>Welcome, {user.firstName || user.email}!</p>
          <div style={{ marginTop: "20px" }}>
            <p><strong>Email:</strong> {user.email}</p>
            {user.avatarUrl && (
              <img
                src={user.avatarUrl}
                alt="Avatar"
                style={{ width: "100px", borderRadius: "50%" }}
              />
            )}
          </div>
          <button
            onClick={handleLogout}
            style={{ marginTop: "20px", padding: "10px 20px" }}
          >
            Logout
          </button>
        </div>
      ) : (
        <p>No user data found</p>
      )}
    </div>
  );
}
