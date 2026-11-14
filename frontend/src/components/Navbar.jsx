
import { Sprout } from "lucide-react";

export default function Navbar() {
  return (
    <header className="navbar">
      <div>
        <h3>Plan the future of farming.</h3>
        <p>
          Make informed decisions with Earth observation data.
        </p>
      </div>

      <div className="navbar-right">
        <Sprout size={28} />
      </div>
    </header>
  );
}
