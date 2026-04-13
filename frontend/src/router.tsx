import { createBrowserRouter } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import AppPage from './pages/Main';
import ProfilePageRoute from './pages/ProfilePageRoute';
import SharedPage from './pages/SharedPage';
import BranchPage from './pages/BranchPage';
import HomePage from "./pages/HomePage";

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />
  },
  {
    path: '/app',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <AppPage />,
      },
      {
        path: 'profile',
        element: <ProfilePageRoute />,
      },
      {
        path: 'shared/:shareId',
        element: <SharedPage />,
      },
      {
        path: 'branch/:branchShareId',
        element: <BranchPage />,
      },
    ],
  },
]);
