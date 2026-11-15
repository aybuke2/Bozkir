
import { Leaf } from "lucide-react";

export default function Navbar() {
  return (
    <header className="navbar bozkir-hero">
      <div className="bozkir-hero-content">
        <h3>Plan the future of farming.</h3>

        <p>
          <Leaf size={17} aria-hidden="true" />
          Make informed decisions with Earth observation data.
        </p>
      </div>

      <div className="bozkir-hero-landscape" aria-hidden="true">
        <div className="bozkir-hero-sun" />
        <div className="bozkir-hero-hill hill-back" />
        <div className="bozkir-hero-hill hill-front" />
        <div className="bozkir-hero-field field-one" />
        <div className="bozkir-hero-field field-two" />
        <div className="bozkir-hero-field field-three" />
      </div>
    </header>
  );
}
