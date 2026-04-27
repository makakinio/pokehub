
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MenuPrincipal from "./pages/menuPrincipal";
import NotFound from "./pages/notFound.jsx";
import Login from "./pages/login.jsx";
import "./App.css"

function App() {
  return (
      <div className="fondo"> 
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<MenuPrincipal />} />
              <Route path="/login" element={<Login />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>      
      </div>
      
    
  );
}

export default App;