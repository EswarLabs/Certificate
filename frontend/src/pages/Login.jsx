import { GoogleLogin } from "@react-oauth/google";
import useAuth from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
export default function Login() {
  const { loginGoogle, loginEmail, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    await loginGoogle(credentialResponse.credential);
    navigate("/dashboard");
  };

  const handleEmailLogin = async (email, password) => {
    await loginEmail(email, password);
    navigate("/dashboard");
  };

  return (
    <>

      {error && <p style={{ color: "red" }}>{error}</p>}
      <GoogleLogin
        onSuccess={handleGoogleLoginSuccess}
        onError={() => {
          console.error("Login Failed");
        }}
      />
      {loading && <p>Loading...</p>}
      <div>
        <h2>Login with Email</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleEmailLogin(e.target.email.value, e.target.password.value);
        }}>
          <input type="email" name="email" placeholder="Email" />
          <input type="password" name="password" placeholder="Password" />
          <button type="submit">Login</button>
          <Link to="/register">Don't have an account? Register</Link>
        </form>
      </div>
    </>
  );

}