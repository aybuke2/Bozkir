
import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  Map,
  Sprout,
  BarChart3,
  Settings
} from "lucide-react";

function Sidebar() {
  return (
    <aside className="sidebar">

      <div className="logo">
        <Sprout size={28} />
        <h2>BOZKIR</h2>
      </div>

      <p className="menu-title">ANA MENÜ</p>

      <nav>

        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `nav-link ${isActive ? "active" : ""}`
          }
        >
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>

        <NavLink
          to="/new-field"
          className={({ isActive }) =>
            `nav-link ${isActive ? "active" : ""}`
          }
        >
          <Map size={20} />
          Tarlalarım
        </NavLink>

        <NavLink
          to="/rotations"
          className={({ isActive }) =>
            `nav-link ${isActive ? "active" : ""}`
          }
        >
          <Sprout size={20} />
          Rotasyon Planı
        </NavLink>

        <NavLink
          to="/analysis"
          className={({ isActive }) =>
            `nav-link ${isActive ? "active" : ""}`
          }
        >
          <BarChart3 size={20} />
          Analizler
        </NavLink>

      </nav>

      <div className="sidebar-bottom">
        <a className="nav-link">
          <Settings size={20} />
          Ayarlar
        </a>
      </div>

    </aside>
  );
}

export default Sidebar;
