"use client";

import { useEffect } from "react";

export default function BootstrapInit() {
  useEffect(() => {
    void import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return null;
}
