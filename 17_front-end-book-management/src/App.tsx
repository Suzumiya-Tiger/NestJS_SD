import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Login from './pages/Login/index.tsx';
import Register from './pages/Register/index.tsx';
import BookManage from './pages/BookManage/index.tsx';

function App() {
  const routes = [
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
    {
      path: "/",
      element: <BookManage />,
    },
  ];

  const router = createBrowserRouter(routes);

  return <RouterProvider router={router} />;
}

export default App;
