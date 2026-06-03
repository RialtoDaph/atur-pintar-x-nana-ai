import { useEffect, useState } from "react";

const MALE_NAMES = ["Rizky", "Fajar", "Dimas", "Aldi", "Bagas", "Reza", "Hafiz", "Arif", "Yusuf", "Bima", "Gilang", "Radit", "Ihsan", "Naufal", "Kevin", "Andre", "Daffa", "Rangga", "Wahyu", "Hanif", "Rio", "Fikri", "Zaky", "Galih", "Yoga"];
const FEMALE_NAMES = ["Devina", "Ayu", "Siti", "Nadia", "Rania", "Putri", "Tiara", "Salsa", "Fira", "Mega", "Indah", "Desi", "Rina", "Wulan", "Anggi", "Cindy", "Della", "Vina", "Yanti", "Hana", "Shinta", "Laras", "Mira", "Fitri", "Nurul"];
const CITIES = ["Jakarta", "Bandung", "Surabaya", "Medan", "Yogyakarta", "Semarang", "Bali", "Makassar"];
const TIME_LABELS = ["barusan", "1 mnt lalu", "2 mnt lalu", "3 mnt lalu", "5 mnt lalu", "7 mnt lalu", "8 mnt lalu", "10 mnt lalu", "12 mnt lalu", "15 mnt lalu"];

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

function Toast({ data, visible }) {
  return (
    <div style={{
      position: "fixed", top: 68, left: 12, zIndex: 9999, maxWidth: 220,
      background: "#ffffff", borderRadius: 10, padding: "7px 11px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(-8px)",
      transition: "opacity 0.35s ease, transform 0.35s ease",
      pointerEvents: "none"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
        <div>
          <p style={{ margin: 0, fontSize: 10, color: "#111", lineHeight: 1.4 }}>
            <span style={{ color: "#f97316", fontWeight: 700 }}>{data.name}</span>
            {" "}dari {data.city} bergabung 🎉
          </p>
          <p style={{ margin: "1px 0 0", fontSize: 9, color: "#999" }}>{data.time}</p>
        </div>
      </div>
    </div>
  );
}

export default function FomoToast() {
  const [data, setData] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const allNames = shuffle([...MALE_NAMES, ...FEMALE_NAMES]);
    const allCities = shuffle(CITIES);
    const allTimes = shuffle(TIME_LABELS);
    let count = 0;
    let cityIdx = 0;
    let timeIdx = 0;
    let interval = null;
    const hideTimers = [];

    const showToast = () => {
      if (count >= 10) return;
      const name = allNames[count % allNames.length];
      const city = allCities[cityIdx % allCities.length];
      const time = allTimes[timeIdx % allTimes.length];
      cityIdx++; timeIdx++;
      setData({ name, city, time });
      setVisible(true);
      count++;
      hideTimers.push(setTimeout(() => setVisible(false), 5000));
    };

    const firstTimer = setTimeout(() => {
      showToast();
      interval = setInterval(() => {
        if (count >= 10) { clearInterval(interval); interval = null; return; }
        showToast();
      }, 20000 + Math.random() * 10000);
    }, 8000);

    return () => {
      clearTimeout(firstTimer);
      if (interval) clearInterval(interval);
      hideTimers.forEach(clearTimeout);
    };
  }, []);

  if (!data) return null;
  return <Toast data={data} visible={visible} />;
}