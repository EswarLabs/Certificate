import { GoogleLogin } from "@react-oauth/google";
import useAuth from "../hooks/useAuth";
import {useNavigate} from "react-router-dom";

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleLoginSuccess = async (credentialResponse) => {
    await login(credentialResponse.credential);
    navigate("/dashboard");
  };

  return (
    <>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <GoogleLogin 
        onSuccess={handleLoginSuccess}
        onError={() => {
          console.error("Login Failed");
        }}
      />
      {loading && <p>Loading...</p>}
    </>
    );

}