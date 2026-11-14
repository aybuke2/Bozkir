
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
        <a className="nav-link active">
          <LayoutDashboard size={20} />
          Dashboard
        </a>

        <a className="nav-link">
          <Map size={20} />
          Tarlalarım
        </a>

        <a className="nav-link">
          <Sprout size={20} />
          Rotasyon Planı
        </a>

        <a className="nav-link">
          <BarChart3 size={20} />
          Analizler
        </a>
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
