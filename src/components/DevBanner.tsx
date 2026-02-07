"use client";

import { useEffect, useState } from "react";

export default function DevBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShow(localStorage.getItem('dev_mode') === '1');
    }
  }, []);

  if (!show) return null;

  return (
    <div style={{
      backgroundColor: '#ff6b6b',
      color: 'white',
      textAlign: 'center',
      padding: '5px',
      fontWeight: 'bold',
      fontSize: '14px'
    }}>
      DEV MODE ACTIVE
    </div>
  );
}
