import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Lobby from "./pages/Lobby";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/lobby/:roomId" element={<Lobby />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;