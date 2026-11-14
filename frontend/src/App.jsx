import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import FieldSelection from "./pages/FieldSelection";
import FieldAnalysis from "./pages/FieldAnalysis";
import RotationComparison from "./pages/RotationComparison";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/new-field" element={<FieldSelection />} />
        <Route path="/analysis" element={<FieldAnalysis />} />
        <Route path="/rotations" element={<RotationComparison />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;