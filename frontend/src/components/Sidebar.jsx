import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  Sprout,
  BarChart3,
} from "lucide-react";

const LINKS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { path: "/new-field", label: "My Fields", icon: Map },
  { path: "/rotations", label: "Rotation Planning", icon: Sprout },
  { path: "/analysis", label: "Field Analysis", icon: BarChart3 },
];

function BozkirLogo() {
  const ears = [
    { x: 100, y: 22, angle: 0 },
    { x: 46, y: 45, angle: -23 },
    { x: 154, y: 45, angle: 23 },
  ];

  return (
    <svg
      className="bozkir-brand-symbol"
      viewBox="0 0 200 160"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Bozkır golden wheat logo"
    >
      <g fill="none" stroke="#F1C968" strokeWidth="3.2" strokeLinecap="round">
        <path d="M100 144 Q100 85 100 22" />
        <path d="M100 144 Q65 91 46 45" />
        <path d="M100 144 Q135 91 154 45" />
      </g>

      {ears.map(({ x, y, angle }, index) => (
        <g
          key={index}
          transform={`translate(${x} ${y}) rotate(${angle})`}
          fill="#F1C968"
        >
          <path d="M0 -12 Q-7 0 0 14 Q7 0 0 -12Z" />
          {[0, 1, 2, 3].map((j) => {
            const offset = j * 14;
            return (
              <g key={j}>
                <path
                  d={`M-2 ${16 + offset} Q-22 ${8 + offset} -17 ${-4 + offset} Q-3 ${3 + offset} -2 ${16 + offset}Z`}
                />
                <path
                  d={`M2 ${16 + offset} Q22 ${8 + offset} 17 ${-4 + offset} Q3 ${3 + offset} 2 ${16 + offset}Z`}
                />
              </g>
            );
          })}
        </g>
      ))}

      <path
        d="M34 145 Q100 127 166 145"
        fill="none"
        stroke="#A8C876"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="bozkir-brand">
        <BozkirLogo />
        <h2>BOZKIR</h2>
        <p>Crop Rotation Advisor</p>
      </div>

      <p className="menu-title">MAIN MENU</p>

      <nav aria-label="Main navigation">
        {LINKS.map(({ path, label, icon: Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <Icon size={20} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="bozkir-sidebar-footer" aria-hidden="true">
        <svg viewBox="0 0 260 145" preserveAspectRatio="none">
          <circle cx="211" cy="35" r="29" fill="#D6A944" opacity=".7" />
          <path d="M0 95 Q60 44 126 87 T260 71 V145 H0Z" fill="#557D4E" />
          <path d="M0 113 Q93 64 260 102 V145 H0Z" fill="#85A75A" />
          <path d="M0 136 Q105 92 260 119 V145 H0Z" fill="#B6C777" />
          <path d="M58 145 Q112 101 172 105" fill="none" stroke="#E2C568" strokeWidth="3" />
          <path d="M116 145 Q155 115 234 112" fill="none" stroke="#E2C568" strokeWidth="3" />
        </svg>
      </div>
    </aside>
  );
}
