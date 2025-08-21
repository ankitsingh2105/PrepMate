import Home from "./Components/Home/Home";
import Signup from "./Components/Signup/Signup";
import Login from "./Components/Login/Login";
import Navbar from "./Components/Navbar/Navbar";
import VideoWindow from "./Components/Home/VideoWindow ";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import SocketProvider from "./Components/VideoCalling/context/SocketProvider";
import store from "./Components/Redux/Store/store";
import Room from "./Components/VideoCalling/screens/Room";
import DSAScreen from "./Components/DSAScreen/DSAScreen";
import Schedule from "./Components/Schedule/Schedule";
import UserProfile from "./Components/UserProfile/UserProfile";
import About from "./Components/AboutSection/About";
import NotFound from "../NotFound";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <>
      <SocketProvider>
        <Provider store={store}>
          <BrowserRouter>
            <Navbar />
            <Routes>
              <Route
                path="/"
                element={
                  <>
                    <Home />
                    <About />
                  </>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dsaMock/room/:room" element={<DSAScreen />} />
              <Route path="/behMock/room/:room" element={<Room />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/user/profile/:userName" element={<UserProfile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </Provider>
      </SocketProvider>
    </>
  );
}

export default App;
