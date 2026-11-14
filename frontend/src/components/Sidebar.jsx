
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Map, Sprout, BarChart3,
} from "lucide-react";

const LINKS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { path: "/new-field", label: "My Fields", icon: Map },
  { path: "/rotations", label: "Rotation Planning", icon: Sprout },
  { path: "/analysis", label: "Field Analysis", icon: BarChart3 },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo">
        <Sprout size={28} />
        <h2>BOZKIR</h2>
      </div>

      <p className="menu-title">MAIN MENU</p>

      <nav>
        {LINKS.map(({ path, label, icon: Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
