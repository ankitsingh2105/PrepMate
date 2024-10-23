import Home from "./Components/Home/Home"
import Signup from "./Components/Signup/Signup"
import Login from "./Components/Login/Login"
import Navbar from "./Components/Navbar/Navbar"
import { BrowserRouter, Route, Routes } from "react-router-dom"
function App() {

  return (
    <>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
