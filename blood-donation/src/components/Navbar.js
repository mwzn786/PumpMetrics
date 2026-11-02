"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { signOutAction } from "@/lib/actions/auth";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/donors", label: "Find Donors" },
  { href: "/request", label: "Post Urgent Request" },
  { href: "/feed", label: "Active Emergency Feed" },
];

function NavLinks({ pathname, onNavigate }) {
  return (
    <ul className="navbar-nav gap-lg-1">
      {LINKS.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <li className="nav-item" key={link.href}>
            <Link
              className={`nav-link${active ? " active" : ""}`}
              href={link.href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function AuthActions({ user, onNavigate }) {
  if (user) {
    return (
      <div className="d-flex flex-column flex-lg-row gap-2">
        <Link className="btn btn-outline-primary" href="/dashboard" onClick={onNavigate}>
          {user.full_name}
        </Link>
        <form action={signOutAction}>
          <button className="btn btn-primary w-100" type="submit">
            Sign out
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column flex-lg-row gap-2">
      <Link className="btn btn-outline-primary" href="/login" onClick={onNavigate}>
        Login
      </Link>
      <Link className="btn btn-primary" href="/register" onClick={onNavigate}>
        Register
      </Link>
    </div>
  );
}

export default function Navbar({ user }) {
  const pathname = usePathname();

  function closeMobileNav(event) {
    const details = event.currentTarget.closest("details");
    if (details) details.open = false;
  }

  return (
    <nav className="navbar navbar-expand-lg hl-navbar sticky-top" aria-label="Primary">
      <div className="container">
        <div className="d-flex align-items-center w-100 gap-3">
          <Link className="navbar-brand d-flex align-items-center gap-2 mb-0" href="/">
            <span className="brand-mark" aria-hidden="true">
              <i className="bi bi-droplet-fill" />
            </span>
            <span className="brand-word">
              Hayat<span>Link</span>
            </span>
            <span className="visually-hidden">{APP_NAME} home</span>
          </Link>

          <div className="d-none d-lg-flex flex-grow-1 align-items-center">
            <NavLinks pathname={pathname} />
            <div className="ms-auto">
              <AuthActions user={user} />
            </div>
          </div>

          <details className="mobile-nav d-lg-none ms-auto">
            <summary className="navbar-toggler" aria-label="Open menu">
              <span className="navbar-toggler-icon" />
            </summary>
            <div className="mobile-nav-panel">
              <NavLinks pathname={pathname} onNavigate={closeMobileNav} />
              <div className="pt-3">
                <AuthActions user={user} onNavigate={closeMobileNav} />
              </div>
            </div>
          </details>
        </div>
      </div>
    </nav>
  );
}
