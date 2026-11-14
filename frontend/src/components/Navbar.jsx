
import { Bell, UserCircle } from "lucide-react";

function Navbar() {
  return (
    <header className="navbar">
      <div>
        <h3>Tarımın geleceğini planla.</h3>
        <p>Çevresel verilerle daha bilinçli kararlar.</p>
      </div>

      <div className="navbar-right">
        <Bell size={21} />
        <UserCircle size={30} />
      </div>
    </header>
  );
}

export default Navbar;
