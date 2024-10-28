import Home from "./Components/Home/Home"
import Signup from "./Components/Signup/Signup"
import Login from "./Components/Login/Login"
import Navbar from "./Components/Navbar/Navbar"
import VideoWindow from "./Components/Home/VideoWindow "
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Provider } from "react-redux"
import SocketProvider from "./Components/VideoCalling/context/SocketProvider";
import store from "./Components/Redux/Store/store"
import Room from "./Components/VideoCalling/screens/Room"
function App() {

  return (
    <>
      <SocketProvider>
        <Provider store={store}>
          <BrowserRouter>
            <Navbar />
            <Routes>
              <Route path="/" element={<><Home /></>} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path='/room/:id' element={<Room roomHeight={200} roomWidth={200} />} />
            </Routes>
          </BrowserRouter>
        </Provider>
      </SocketProvider>
    </>
  )
}

export default App
