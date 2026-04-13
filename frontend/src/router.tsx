import { createBrowserRouter } from "react-router-dom";

import RootLayout from "./layouts/RootLayout";
import AppPage from "./pages/app/Main";
import ProfilePageRoute from "./pages/app/Profile";
import SharedPage from "./pages/app/Shared";
import BranchPage from "./pages/app/Branch";
import HomePage from "./pages/Home";

// AUTH
import AuthLayout from "./layouts/AuthLayout";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import OTPAuth from "./pages/auth/OTPAuth";
import PasskeyLogin from "./pages/auth/PasskeyLogin";
import { RobotProvider } from "./context/robotProvider";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },

  // AUTH ROUTES
  {
    path: "/auth",
    element: <RobotProvider><AuthLayout /></RobotProvider>,
    children: [
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "signup",
        element: <Signup />,
      },
      {
        path: "forgot",
        element: <ForgotPassword />,
      },
      {
        path: "reset",
        element: <ResetPassword />,
      },
      {
        path: "2FA",
        element: <OTPAuth />,
      },
      {
        path: "passkey",
        element: <PasskeyLogin />,
      },
    ],
  },

  // APP ROUTES
  {
    path: "/app",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <AppPage />,
      },
      {
        path: "profile",
        element: <ProfilePageRoute />,
      },
      {
        path: "shared/:shareId",
        element: <SharedPage />,
      },
      {
        path: "branch/:branchShareId",
        element: <BranchPage />,
      },
    ],
  },
]);