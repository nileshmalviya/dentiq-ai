import { NavLink } from "react-router-dom";
import { Brand } from "./Brand";

type Item = { label: string; to: string };

export function SideNav({ title, items }: { title: string; items: Item[] }) {
  return (
    <aside className="sidebar">
      <Brand />
      <p className="nav-caption">{title}</p>
      <nav className="nav-list">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">Static UI preview</div>
    </aside>
  );
}
